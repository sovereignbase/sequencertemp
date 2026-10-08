import { getRandom53bitNumber } from '../auxiliary/getRandom53bitNumber.js'
import { anchorStrip } from '../auxiliary/anchorStrip.js'
import { insertFirst } from '../auxiliary/insertFirst.js'
import type { Projection } from '../class.js'
import type { Sequence, Strip } from '../types/type.js'
import { findContainingFragment } from '../auxiliary/findContainingFragment.js'

/**
 * Initializes a Projection from optional trusted state and assigns fresh sessions.
 *
 * @param this Projection to initialize.
 * @param trustedSequence Optional dependency-ordered Sequence; not shape-validated.
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

    for (let index = 0; index < projection.length; ++index) {
      const incoming = projection[index]
      let incomingStrip: Strip<T>

      // Reserve both dependency and author Session IDs, including references not materialized here.
      void unsafeIDs.add(incoming[0])
      void unsafeIDs.add(incoming[3])

      // Hydrate runtime metadata without changing canonical coordinates or copying Footage.
      incomingStrip = {
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

          ;[anchorDiff, anchoringStrip] = findContainingFragment(
            origin,
            incomingStrip
          )
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
    }

    let jumpStart = this.structuralHead
    let jumpCursor = this.structuralHead
    let jumpFrameCount = 0
    let jumpStripCount = 0
    let tailJumpStart: Strip<T>

    // Recompute visible boundaries from the completed graph, not intermediate edit order.
    this.head = undefined
    this.tail = undefined

    // Build jumps from the completed structure, after all splits and removals.
    while (jumpCursor) {
      const diff = jumpCursor.fragmentDiff ?? jumpCursor.insertionDiff

      // Only positive runtime lengths occupy visible indices; masks still count as structural nodes.
      if (diff > 0) {
        // The first positive Strip establishes index zero; restart jump counts to exclude hidden prefixes.
        if (!this.head) {
          this.head = jumpCursor
          // Begin the next span at this destination; reset distances rather than carrying the previous span.
          jumpStart = jumpCursor
          jumpFrameCount = 0
          jumpStripCount = 0
        }
        // Each positive Strip replaces the tail; remember its spanning jump for final boundary cleanup.
        this.tail = jumpCursor
        tailJumpStart = jumpStart
      }

      // Visible distance sums positive lengths only; every visited node adds one structural step.
      jumpFrameCount += Math.max(0, diff)
      ++jumpStripCount

      jumpCursor = jumpCursor.rightStep

      // Link only a complete span with an existing destination; no jump may end beyond the graph.
      if (jumpStripCount === jumpSpacing && jumpCursor) {
        jumpStart!.rightJump = jumpCursor
        jumpStart!.rightJumpFrameCount = jumpFrameCount
        jumpStart!.rightJumpStripCount = jumpStripCount

        // Mirror the same distances in both directions of the jump.
        jumpCursor.leftJump = jumpStart
        jumpCursor.leftJumpFrameCount = jumpFrameCount
        jumpCursor.leftJumpStripCount = jumpStripCount

        jumpStart = jumpCursor
        jumpFrameCount = 0
        jumpStripCount = 0
      }
    }
    // Remove a jump crossing the visible tail into hidden suffix history so traversal retains
    // that known visible boundary. Clear both endpoint links.
    if (tailJumpStart && tailJumpStart !== this.tail && tailJumpStart.rightJump) {
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
