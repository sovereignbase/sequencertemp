import { findProjectionPositionOfStrip } from '../auxiliary/findProjectionPositionOfStrip.js'
import { anchorStrip } from '../auxiliary/anchorStrip.js'
import { insertFirst } from '../auxiliary/insertFirst.js'
import { isAcknowledgement, isInsertion } from '../auxiliary/isGossip.js'
import type { Projection } from '../class.js'
import type {
  Acknowledgement,
  Change,
  Insertion,
  Result,
  Strip,
} from '../types/type.js'
import { findContainingFragment } from '../auxiliary/findContainingFragment.js'
import { findFramePositionByProjectionPosition } from '../auxiliary/findFramePositionByProjectionPosition.js'

export function apply<T>(
  this: Projection<T>,
  gossip: unknown
): Result<T> | undefined {
  if (!Array.isArray(gossip)) return

  const projectedPosition = this.projectedPosition
  const changes = []
  const acknowledgements: Array<Acknowledgement> = []

  for (const entry of gossip) {
    if (isAcknowledgement(entry)) {
      void this.frontierTable.observeAcknowledgement(entry)
      continue
    }

    if (!isInsertion<T>(entry)) return

    const queue: Array<Insertion<T>> = [entry]

    while (queue.length !== 0) {
      const incoming = queue.pop()!

      if (incoming[5] < 0) {
        const acknowledgement: Acknowledgement = [
          this.actorID,
          incoming[3],
          incoming[4] - incoming[5],
        ]

        void this.frontierTable.observeAcknowledgement(acknowledgement)
        void acknowledgements.push(acknowledgement)
      }

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
      let projectionDiff = incomingStrip.insertionDiff

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

        void anchorStrip.call(this, incomingStrip, anchoringStrip, anchorDiff)

        projectionDiff =
          incomingStrip.fragmentDiff ?? incomingStrip.insertionDiff

        if (
          projectionDiff < 0 &&
          anchoringStrip === this.gate &&
          (this.gate!.fragmentDiff ?? this.gate!.insertionDiff) === 0
        ) {
          this.gate = incomingStrip
        }

        startAt = findProjectionPositionOfStrip.call(
          this,
          incomingStrip,
          projectionDiff
        )
      }

      void this.containmentTable.set(incomingStrip)

      if (projectionDiff > 0) {
        void changes.push([
          startAt,
          startAt,
          incomingStrip.footage ??
            new Array<T | undefined>(incomingStrip.insertionDiff),
        ])
      } else if (projectionDiff < 0) {
        void changes.push([startAt, startAt - projectionDiff])
      }

      const pending = this.pendingTable.take(incomingStrip)

      if (pending)
        for (let i = pending.length - 1; i >= 0; --i)
          void queue.push(pending[i])
    }
  }

  if (changes.length !== 0) {
    if (this.projectionFrameCount > 0) {
      void findFramePositionByProjectionPosition.call(
        this,
        Math.min(projectedPosition, this.projectionFrameCount - 1)
      )
    } else {
      this.gate = undefined
      this.gatePosition = 0
    }
    this.projectedPosition = projectedPosition
  }

  return acknowledgements.length === 0
    ? [changes as unknown as Change<T>]
    : [changes as unknown as Change<T>, acknowledgements]
}
