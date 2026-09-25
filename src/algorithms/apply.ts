import { findProjectionPositionOfStrip } from '../auxiliary/findProjectionPositionOfStrip.js'
import { anchorStrip } from '../auxiliary/anchorStrip.js'
import { insertFirst } from '../auxiliary/insertFirst.js'
import { isAcknowledgement, isInsertion } from '../auxiliary/isGossip.js'
import { patchJumps } from '../auxiliary/patchJumps.js'
import type { Projection } from '../class.js'
import type {
  Acknowledgement,
  Change,
  Insertion,
  Result,
  Strip,
} from '../types/type.js'
import { findContainingFragment } from '../auxiliary/findContainingFragment.js'

export function apply<T>(
  this: Projection<T>,
  gossip: unknown
): Result<T> | undefined {
  if (!Array.isArray(gossip)) return

  const changes = []
  const acknowledgements: Array<Acknowledgement> = []
  let gateRemoved = false

  for (const entry of gossip) {
    if (isAcknowledgement(entry)) {
      void this.frontierTable.observeAcknowledgement(entry)
      continue
    }

    if (!isInsertion<T>(entry)) return

    const queue: Array<Insertion<T>> = [entry]

    while (queue.length !== 0) {
      const incoming = queue.pop()!

      if (this.containmentTable.has(incoming)) continue

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
      let startAt = 0

      if (birth && this.structuralStripCount === 0) {
        void insertFirst.call(this, incomingStrip)
      } else {
        let anchoringStrip: Strip<T>
        let anchorDiff = 0

        if (!birth) {
          const origin = this.containmentTable.get(incoming)

          if (!origin) {
            void this.pendingTable.set(incoming)
            continue
          }

          ;[anchorDiff, anchoringStrip] = findContainingFragment(
            origin,
            incomingStrip
          )
        }

        const previousStructuralStripCount = this.structuralStripCount

        void anchorStrip.call(this, incomingStrip, anchoringStrip, anchorDiff)

        void patchJumps.call(
          this,
          incomingStrip.insertionDiff,
          this.structuralStripCount - previousStructuralStripCount
        )

        if (
          incomingStrip.insertionDiff < 0 &&
          anchoringStrip === this.gate &&
          (this.gate!.fragmentDiff ?? this.gate!.insertionDiff) === 0
        ) {
          this.gate = this.gate!.rightFragment
          gateRemoved = true
        }

        startAt = findProjectionPositionOfStrip.call(
          this,
          incomingStrip,
          incomingStrip.insertionDiff
        )

        if (gateRemoved && incomingStrip.insertionDiff > 0) {
          this.gate = incomingStrip
          this.projectedPosition = startAt
          gateRemoved = false
        }

      }

      void this.containmentTable.set(incomingStrip)

      if (incomingStrip.insertionDiff > 0) {
        void changes.push([
          startAt,
          startAt,
          incomingStrip.footage ??
            new Array<T | undefined>(incomingStrip.insertionDiff),
        ])
      } else {
        void changes.push([startAt, startAt - incomingStrip.insertionDiff])
      }

      const pending = this.pendingTable.take(incomingStrip)

      if (pending)
        for (let i = pending.length - 1; i >= 0; --i)
          void queue.push(pending[i])

      if (incomingStrip.insertionDiff > 0) {
        if (incomingStrip.insertionSession === this.increaseClock[0])
          this.increaseClock[1] = Math.max(
            this.increaseClock[1],
            incomingStrip.insertionStart + incomingStrip.insertionDiff
          )

        continue
      }

      // Impossible
      if (incomingStrip.insertionSession === this.decreaseClock[0])
        this.decreaseClock[1] = Math.max(
          this.decreaseClock[1],
          incomingStrip.insertionStart - incomingStrip.insertionDiff
        )

      const acknowledgement: Acknowledgement = [
        this.actorID,
        incomingStrip.insertionSession,
        incomingStrip.insertionStart - incomingStrip.insertionDiff,
      ]

      void this.frontierTable.observeAcknowledgement(acknowledgement)
      void acknowledgements.push(acknowledgement)
    }
  }

  return acknowledgements.length === 0
    ? [changes as unknown as Change<T>]
    : [changes as unknown as Change<T>, acknowledgements]
}
