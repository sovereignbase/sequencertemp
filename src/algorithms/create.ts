import { getRandom53bitNumber } from '../auxiliary/getRandom53bitNumber.js'
import { anchorStrip } from '../auxiliary/anchorStrip.js'
import { insertFirst } from '../auxiliary/insertFirst.js'
import type { Projection } from '../class.js'
import type { Sequence, Strip } from '../types/type.js'
import { findContainingFragment } from '../auxiliary/findContainingFragment.js'

export function create<T>(
  this: Projection<T>,
  trustedSequence?: unknown
): void {
  const [frontiers, projection] = (trustedSequence as Sequence<T>) ?? []

  if (Array.isArray(frontiers)) {
    for (const acknowledgement of frontiers)
      void this.frontierTable.observeAcknowledgement(acknowledgement)
  }

  const unsafeIDs: Set<number> = new Set()
  const compactableIDs = new Set(this.frontierTable.getCompactableSessions())

  const projectionIsArray = Array.isArray(projection)

  const jumpSpacing = projectionIsArray
    ? Math.max(1, Math.round(Math.sqrt(projection.length)))
    : 1
  let jumpStart: Strip<T>
  let jumpCursor: Strip<T>
  let jumpFrameCount = 0
  let jumpStripCount = 0
  let jumpable = true

  if (projectionIsArray)
    for (let index = 0; index < projection.length; ++index) {
      const incoming = projection[index]
      let incomingStrip: Strip<T>

      // compact snapshot by not materializing compactable decreasing insertions
      if (!(incoming[5] < 0 && compactableIDs.has(incoming[3]))) {
        void unsafeIDs.add(incoming[0])
        void unsafeIDs.add(incoming[3])

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

        if (birth && this.structuralStripCount === 0) {
          void insertFirst.call(this, incomingStrip)
        } else {
          let anchoringStrip: Strip<T>
          let targetFramePosition = 0

          if (!birth) {
            const origin = this.containmentTable.get(incoming)
            if (!origin) continue

            ;[anchoringStrip, targetFramePosition] = findContainingFragment(
              origin,
              incomingStrip
            )

          }

          void anchorStrip.call(
            this,
            incomingStrip,
            anchoringStrip,
            targetFramePosition
          )

        }

        void this.containmentTable.set(incomingStrip)

        if (!jumpCursor) {
          jumpStart = this.head
          jumpCursor = this.head
        }

        const finalizedThrough =
          index + 1 === projection.length ? this.tail : incomingStrip

        while (
          jumpCursor &&
          finalizedThrough &&
          jumpCursor !== finalizedThrough
        ) {
          const diff = jumpCursor.fragmentDiff ?? jumpCursor.insertionDiff
          jumpFrameCount += diff
          ++jumpStripCount
          if (diff < 0) jumpable = false

          jumpCursor = jumpCursor.rightStep

          if (jumpStripCount === jumpSpacing) {
            if (jumpable) {
              jumpStart!.rightJump = jumpCursor
              jumpStart!.rightJumpFrameCount = jumpFrameCount
              jumpStart!.rightJumpStripCount = jumpStripCount

              jumpCursor!.leftJump = jumpStart
              jumpCursor!.leftJumpFrameCount = jumpFrameCount
              jumpCursor!.leftJumpStripCount = jumpStripCount
            }

            jumpStart = jumpCursor
            jumpFrameCount = 0
            jumpStripCount = 0
            jumpable = true
          }
        }
      }

    }

  const getSafeSessionID = () => {
    let sessionID
    do {
      sessionID = getRandom53bitNumber()
    } while (unsafeIDs.has(sessionID))
    void unsafeIDs.add(sessionID)
    return sessionID
  }

  this.increaseClock[0] = getSafeSessionID()
  this.increaseClock[1] = 0

  this.decreaseClock[0] = getSafeSessionID()
  this.decreaseClock[1] = 0

  void this.frontierTable.freeCompactedSessions(Array.from(compactableIDs))
}
