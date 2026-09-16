import { findVisibleIndexOfStrip } from '../auxiliary/findVisibleIndexOfStrip.js'
import { getRandom53bitNumber } from '../auxiliary/getRandom53bitNumber.js'
import { insertAfter } from '../auxiliary/insertAfter.js'
import { insertBefore } from '../auxiliary/insertBefore.js'
import { insertFirst } from '../auxiliary/insertFirst.js'
import { patchJumps } from '../auxiliary/patchJumps.js'
import type { Sequence } from '../class.js'
import type { Snapshot, Strip } from '../types/type.js'

export function create<T>(this: Sequence<T>, trustedSnapshot?: unknown): void {
  const [frontiers, projection] = (trustedSnapshot as Snapshot<T>) ?? []

  if (Array.isArray(frontiers)) {
    for (const acknowledgement of frontiers)
      void this.frontierTable.observeAcknowledgement(acknowledgement)
  }

  const unsafeIDs: Set<number> = new Set()
  const compactableIDs = new Set(this.frontierTable.getCompactableSessions())

  if (Array.isArray(projection))
    for (const incoming of projection) {
      // compact snapshot by not materializing compactable decreasing insertions
      if (incoming[5] < 0 && compactableIDs.has(incoming[3])) continue

      void unsafeIDs.add(incoming[0])
      void unsafeIDs.add(incoming[3])

      const incomingStrip: NonNullable<Strip<T>> = {
        anchorSession: incoming[0],
        anchorTime: incoming[1],
        anchorFrame: incoming[2],
        insertionSession: incoming[3],
        insertionTime: incoming[4],
        insertionDiff: incoming[5],
        footage: incoming[6],
      }

      const birth =
        incomingStrip.anchorSession === 0 &&
        incomingStrip.anchorTime === 0 &&
        incomingStrip.anchorFrame === 0

      if (birth && this.structuralStripCount === 0) {
        insertFirst.call(this, incomingStrip)
      } else {
        let containingStrip: NonNullable<Strip<T>>
        let targetFramePosition: number

        if (birth) {
          containingStrip = this.head!
          targetFramePosition = 1
        } else {
          const origin = this.containmentTable.get(incoming)
          if (!origin) continue

          containingStrip = origin
          targetFramePosition = incomingStrip.anchorFrame

          while (true) {
            const containingStripLength = Math.abs(
              containingStrip.fragmentDiff ?? containingStrip.insertionDiff
            )

            if (
              targetFramePosition <= containingStripLength ||
              (incomingStrip.insertionDiff > 0 &&
                targetFramePosition === containingStripLength + 1 &&
                containingStrip.rightFragment !== containingStrip.rightStep &&
                containingStrip.rightStep?.anchorSession ===
                  incomingStrip.anchorSession &&
                containingStrip.rightStep.anchorTime ===
                  incomingStrip.anchorTime &&
                containingStrip.rightStep.anchorFrame ===
                  incomingStrip.anchorFrame)
            )
              break

            const rightFragment = containingStrip.rightFragment
            if (!rightFragment) break

            targetFramePosition -= containingStripLength
            containingStrip = rightFragment
          }
        }

        findVisibleIndexOfStrip.call(this, containingStrip)

        const previousStructuralStripCount = this.structuralStripCount

        if (targetFramePosition === 1)
          insertBefore.call(this, incomingStrip, containingStrip)
        else
          insertAfter.call(
            this,
            incomingStrip,
            containingStrip,
            targetFramePosition
          )

        patchJumps.call(
          this,
          incomingStrip.insertionDiff,
          this.structuralStripCount - previousStructuralStripCount
        )
      }

      this.containmentTable.set(incomingStrip)
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
