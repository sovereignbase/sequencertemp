import { getRandom53bitNumber } from '../auxiliary/getRandom53bitNumber.js'
import { anchorStrip } from '../auxiliary/anchorStrip.js'
import { insertFirst } from '../auxiliary/insertFirst.js'
import type { Projection } from '../class.js'
import type { Sequence, Strip } from '../types/type.js'
import { findContainingFragment } from '../auxiliary/findContainingFragment.js'
import { linkJumps } from '../auxiliary/linkJumps.js'

/**
 * Initializes a Projection from optional trusted state and assigns fresh sessions.
 *
 * @param this Projection to initialize.
 * @param trustedSequence Optional Sequence in Structural Order; not shape-validated.
 */
export function create<T>(
  this: Projection<T>,
  trustedSequence?: unknown
): void {
  // Absent trusted state yields an empty Projection; this path assumes trusted tuple contents.
  const [frontiers, projection] = (trustedSequence as Sequence<T>) ?? []

  // Frontiers are optional in an empty initialization; supplied ones establish known Actors.
  if (Array.isArray(frontiers)) {
    for (const acknowledgement of frontiers)
      void this.frontierTable.observeAcknowledgement(acknowledgement)
  }

  // Reserve referenced Session identifiers so fresh clocks cannot reuse snapshot identities.
  const unsafeIDs: Set<number> = new Set()

  if (Array.isArray(projection)) {
    // Use at least one structural step per jump, including for an empty snapshot.
    const jumpSpacing = Math.max(1, Math.round(Math.sqrt(projection.length)))
    // Hydration-only progress through each original Insertion's fragments.
    // Unfragmented parents need no entry; the live containment index keeps its original Strip.
    const fragments = new Map<NonNullable<Strip<T>>, NonNullable<Strip<T>>>()

    let jumpStart: Strip<T>
    let jumpCursor: Strip<T>
    let jumpFrameCount = 0
    let jumpStripCount = 0
    let tailJumpStart: Strip<T>
    let head: Strip<T>
    let tail: Strip<T>

    for (let index = 0; index < projection.length; ++index) {
      const incoming = projection[index]

      // Reserve both dependency and author Session IDs, including references not materialized here.
      void unsafeIDs.add(incoming[0])
      void unsafeIDs.add(incoming[3])

      // Hydrate runtime metadata without changing canonical coordinates or copying Footage.
      const incomingStrip: NonNullable<Strip<T>> = {
        anchorSession: incoming[0],
        anchorStart: incoming[1],
        anchorDiff: incoming[2],
        insertionSession: incoming[3],
        insertionStart: incoming[4],
        insertionDiff: incoming[5],
        footage: incoming[6],
      }

      const birth =
        incomingStrip.anchorSession === 0 &&
        incomingStrip.anchorStart === 0 &&
        incomingStrip.anchorDiff === 0

      // Only the first virtual-root Insertion initializes boundaries; later roots use competition.
      if (birth && this.structuralStripCount === 0) {
        void insertFirst.call(this, incomingStrip)
      } else {
        let anchoringStrip: Strip<T>
        let anchorDiff = 0

        if (!birth) {
          const origin = this.containmentTable.get(incoming)
          // Trusted hydration requires parents before children; unlike apply, this path does not queue.
          if (!origin) continue

          const fragment = origin.rightFragment
            ? (fragments.get(origin) ?? origin)
            : origin
          // An equal left boundary may have competitors on the preceding fragment.
          // Older logical points still resolve from the original Strip.
          ;[anchorDiff, anchoringStrip] = findContainingFragment(
            incomingStrip.anchorDiff > (fragment.fragmentStart ?? 0)
              ? fragment
              : origin,
            incomingStrip
          )
          // A consumed point can resolve into a mask with a different coordinate origin.
          if (
            origin.rightFragment &&
            anchoringStrip.insertionSession === origin.insertionSession &&
            anchoringStrip.insertionStart === origin.insertionStart
          )
            fragments.set(origin, anchoringStrip)
        }

        void anchorStrip.call(this, incomingStrip, anchoringStrip, anchorDiff)
      }

      // Make the materialized identity available to later dependency-ordered entries.
      void this.containmentTable.set(incomingStrip)

      // Record the local Actor's receipt of each hydrated mask at its original logical end.
      if (incomingStrip.insertionDiff < 0) {
        void this.frontierTable.observeAcknowledgement([
          this.actorID,
          incomingStrip.insertionSession,
          incomingStrip.insertionStart - incomingStrip.insertionDiff,
        ])
      }

      // Sequence tuples follow Structural Order. Later tuples may still split
      // the new Strip, so finalize only the preceding prefix; flush on the last tuple.
      if (!jumpCursor) jumpStart = jumpCursor = this.structuralHead
      const stop = index + 1 < projection.length ? incomingStrip : undefined
      while (jumpCursor && jumpCursor !== stop) {
        const diff = jumpCursor.fragmentDiff ?? jumpCursor.insertionDiff

        // Only positive runtime lengths occupy visible indices; masks still count as structural nodes.
        if (diff > 0) {
          // The first positive Strip establishes index zero; restart jump counts to exclude hidden prefixes.
          if (!head) {
            head = jumpCursor
            // Begin the next span at this destination; reset distances rather than carrying the previous span.
            jumpStart = jumpCursor
            jumpFrameCount = 0
            jumpStripCount = 0
          }
          // Each positive Strip replaces the tail; remember its spanning jump for final boundary cleanup.
          tail = jumpCursor
          tailJumpStart = jumpStart
        }

        // Visible distance sums positive lengths only; every visited node adds one structural step.
        jumpFrameCount += Math.max(0, diff)
        ++jumpStripCount

        jumpCursor = jumpCursor.rightStep

        // Install reciprocal distances only for a complete span with an existing destination.
        if (jumpStripCount === jumpSpacing && jumpCursor) {
          linkJumps(jumpStart!, jumpCursor, jumpFrameCount, jumpStripCount)

          jumpStart = jumpCursor
          jumpFrameCount = 0
          jumpStripCount = 0
        }
      }
    }
    this.head = head
    this.tail = tail
    // Remove a jump crossing the visible tail into hidden suffix history so traversal retains
    // that known visible boundary. Clear both endpoint links.
    if (
      tailJumpStart &&
      tailJumpStart !== this.tail &&
      tailJumpStart.rightJump
    ) {
      tailJumpStart.rightJump.leftJump = undefined
      tailJumpStart.rightJump = undefined
    }
  }

  // Initial traversal starts at visible index zero, or remains unset when no Frames are visible.
  this.gate = this.head

  const getSafeSessionID = () => {
    let sessionID
    // A random identifier is accepted only when absent from the snapshot and earlier clock choices.
    do {
      sessionID = getRandom53bitNumber()
    } while (unsafeIDs.has(sessionID))
    // Reserve the accepted identifier immediately so the second clock cannot choose it.
    void unsafeIDs.add(sessionID)
    return sessionID
  }

  // New positive and reducing Sessions each begin at logical time zero.
  this.increaseClock[0] = getSafeSessionID()
  this.increaseClock[1] = 0

  this.decreaseClock[0] = getSafeSessionID()
  this.decreaseClock[1] = 0
}
