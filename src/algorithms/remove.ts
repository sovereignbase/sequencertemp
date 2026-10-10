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

  // Inclusive bounds consume end-start+1 Frames; an inverted range creates no masks.
  let remaining = endWith - startAt + 1

  // Removing each chunk shifts the next selected Frame into the same startAt position.
  while (remaining > 0) {
    // Resolve once per affected visible fragment; the resolver leaves its Strip at gate.
    const anchorDiff = findFramePositionByProjectionPosition.call(this, startAt)
    const anchoringStrip = this.gate!

    // Stop at either the selection end or this fragment's original right boundary.
    // One local mask therefore targets only Frames known to be visible in this fragment.
    const decreasingLength = Math.min(
      remaining,
      (anchoringStrip.fragmentStart ?? 0) +
        (anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff) -
        anchorDiff
    )

    // Canonical anchor fields identify the original positive Insertion; the separate
    // reducing Session identifies this mask, whose original length stays negative.
    const decreasingStrip: NonNullable<Strip<T>> = {
      anchorSession: anchoringStrip.insertionSession,
      anchorStart: anchoringStrip.insertionStart,
      anchorDiff: anchorDiff,
      insertionSession: this.decreaseClock[0],
      insertionStart: this.decreaseClock[1],
      insertionDiff: -decreasingLength,
    }

    // Capture physical growth so jump bookkeeping includes fragments introduced by splitting.
    const previousStructuralStripCount = this.structuralStripCount

    // Apply at the already resolved point; local removal does not search for the mask's visible index.
    void anchorStrip.call(this, decreasingStrip, anchoringStrip, anchorDiff)

    void patchJumps.call(
      this,
      decreasingStrip.insertionDiff,
      this.structuralStripCount - previousStructuralStripCount,
      decreasingStrip
    )

    // Retain the mask identity even though it has no visible Frames, for deduplication and dependencies.
    void this.containmentTable.set(decreasingStrip)

    // At the fragment's start, its new mask retains the same known visible boundary.
    if (startAt === this.gatePosition) this.gate = decreasingStrip

    // Emit the original mask tuple; remote peers resolve their own runtime fragment ownership.
    void insertions.push([
      decreasingStrip.anchorSession,
      decreasingStrip.anchorStart,
      decreasingStrip.anchorDiff,
      decreasingStrip.insertionSession,
      decreasingStrip.insertionStart,
      decreasingStrip.insertionDiff,
    ])

    // Reserve this mask's affected length and final logical boundary before sequencing the next mask.
    this.decreaseClock[1] += decreasingLength + 1

    // Account only for the Frames consumed in this iteration; do not advance the visible start.
    remaining -= decreasingLength
  }

  // The last reserved point is next logical time minus one, matching the final mask's logical end.
  const acknowledgement = [
    this.actorID,
    this.decreaseClock[0],
    this.decreaseClock[1] - 1,
  ]

  // Observe the local claim before returning it for replication.
  void this.frontierTable.observeAcknowledgement(acknowledgement)
  void insertions.push(acknowledgement)

  return insertions
}
