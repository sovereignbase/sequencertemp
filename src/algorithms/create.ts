import { findVisibleIndexOfStrip } from '../auxiliary/findVisibleIndexOfStrip.js'
import { insertAfter } from '../auxiliary/insertAfter.js'
import { insertBefore } from '../auxiliary/insertBefore.js'
import { insertFirst } from '../auxiliary/insertFirst.js'
import { patchJumps } from '../auxiliary/patchJumps.js'
import type { Sequence } from '../class.js'
import type { Snapshot, Strip } from '../types/type.js'

export function create<T>(
  this: Sequence<T>,
  actorID: number,
  trustedSnapshot?: unknown
): void {
  let time = 0

  const [frontiers, projection] = (trustedSnapshot as Snapshot<T>) ?? []

  if (Array.isArray(frontiers)) {
    // Actors must exist before acknowledgements are observed.
    for (const acknowledgement of frontiers) {
      if (acknowledgement.length === 0) continue
      void this.frontierTable.observeActor(acknowledgement[0])
    }

    for (const acknowledgement of frontiers)
      void this.frontierTable.observeAcknowledgement(acknowledgement)
  }

  const compactableIDs = new Set(this.frontierTable.getCompactableSessions())

  if (Array.isArray(projection))
    for (const incoming of projection) {
      // compact snapshot by not materializing compactable decreasing insertions
      if (incoming[5] < 0 && compactableIDs.has(incoming[3])) continue

      const incomingStrip: NonNullable<Strip<T>> = {
        anchorSequencer: incoming[0],
        anchorTime: incoming[1],
        anchorFrame: incoming[2],
        insertionSequencer: incoming[3],
        insertionTime: incoming[4],
        insertionDiff: incoming[5],
        footage: incoming[6],
      }

      if (
        incomingStrip.insertionDiff > 0 &&
        incomingStrip.insertionSequencer === actorID
      )
        time = Math.max(
          time,
          incomingStrip.insertionTime + incomingStrip.insertionDiff + 1
        )

      const birth =
        incomingStrip.anchorSequencer === 0 &&
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
              (targetFramePosition === containingStripLength + 1 &&
                containingStrip.rightFragment !== containingStrip.rightStep &&
                containingStrip.rightStep?.anchorSequencer ===
                  incomingStrip.anchorSequencer &&
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

      if (incomingStrip.insertionDiff > 0)
        void this.frontierTable.observeActor(incomingStrip.insertionSequencer)
    }

  // The current actor becomes part of the frontier only after determining
  // what was already compactable in the stored snapshot.
  void this.frontierTable.observeActor(actorID)

  this.increaseClock[0] = actorID
  this.increaseClock[1] = time

  this.decreaseClock[0] = this.frontierTable.getSafeSessionID()
  this.decreaseClock[1] = 0

  void this.frontierTable.freeCompactedSessions(Array.from(compactableIDs))
}
