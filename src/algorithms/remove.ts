import { findFramePositionByProjectionPosition } from '../auxiliary/findFramePositionByProjectionPosition.js'
import { anchorStrip } from '../auxiliary/anchorStrip.js'
import { patchJumps } from '../auxiliary/patchJumps.js'
import type { Projection } from '../class.js'
import type { Gossip, Strip } from '../types/type.js'

/**
 * Sequences reducing Insertions for an inclusive visible range.
 *
 * @param this Projection to edit.
 * @param startAt First position to remove; defaults to 0.
 * @param endWith Last position to remove; defaults to the last visible position.
 * @returns Reducing Insertions followed by the local acknowledgement.
 */
export function remove<T>(
  this: Projection<T>,
  startAt: number = 0,
  endWith: number = this.projectionFrameCount - 1
): Gossip<T> {
  const insertions = []

  let remaining = endWith - startAt + 1

  while (remaining > 0) {
    const anchorDiff = findFramePositionByProjectionPosition.call(this, startAt)
    const anchoringStrip = this.gate!

    const decreasingLength = Math.min(
      remaining,
      (anchoringStrip.fragmentStart ?? 0) +
        (anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff) -
        anchorDiff
    )

    const decreasingStrip: NonNullable<Strip<T>> = {
      anchorSession: anchoringStrip.insertionSession,
      anchorStart: anchoringStrip.insertionStart,
      anchorDiff: anchorDiff,
      insertionSession: this.decreaseClock[0],
      insertionStart: this.decreaseClock[1],
      insertionDiff: -decreasingLength,
    }

    const previousStructuralStripCount = this.structuralStripCount

    void anchorStrip.call(this, decreasingStrip, anchoringStrip, anchorDiff)

    void patchJumps.call(
      this,
      decreasingStrip.insertionDiff,
      this.structuralStripCount - previousStructuralStripCount
    )

    void this.containmentTable.set(decreasingStrip)

    void insertions.push([
      decreasingStrip.anchorSession,
      decreasingStrip.anchorStart,
      decreasingStrip.anchorDiff,
      decreasingStrip.insertionSession,
      decreasingStrip.insertionStart,
      decreasingStrip.insertionDiff,
    ])

    this.decreaseClock[1] += decreasingLength + 1

    remaining -= decreasingLength
  }

  const acknowledgement = [
    this.actorID,
    this.decreaseClock[0],
    this.decreaseClock[1] - 1,
  ]

  void this.frontierTable.observeAcknowledgement(acknowledgement)
  void insertions.push(acknowledgement)

  return insertions
}
