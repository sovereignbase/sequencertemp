import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'

import { findFramePositionByProjectionPosition } from '../auxiliary/findFramePositionByProjectionPosition.js'
import { containsAnchor } from './containsAnchor.js'

/**
 * Selects the stable anchor point for a local insertion.
 *
 * A Projection position occupied by a Frame identifies the Frame that the new
 * insertion moves to the right. Its zero-based position in the original
 * insertion's Footage is also the logical anchor point immediately preceding
 * that Frame. {@link findFramePositionByProjectionPosition} therefore provides
 * `anchorDiff` directly and leaves `gate` on the anchoring Strip or fragment.
 *
 * Projection position zero follows the same rule. It resolves to the first
 * projected Frame and therefore to that Frame's left anchor point, which may
 * be zero or a later `fragmentStart` when the original insertion has already
 * been fragmented.
 *
 * The Projection end is the only position without a Frame to resolve. It is
 * anchored explicitly to the right boundary of the tail fragment. That stable
 * boundary is its `fragmentStart` plus its absolute fragment length.
 *
 * @param this Projection receiving the insertion.
 * @param of Inclusive projection position at which the insertion begins.
 * @returns Stable `anchorDiff` and the insertion's anchoring Strip or fragment.
 */
export function selectAnchor<T>(
  this: Projection<T>,
  of: number
): [number, Strip<T>] {
  let anchorDiff: number
  let anchoringStrip: NonNullable<Strip<T>>

  // The Projection end has no Frame to resolve, so use the tail fragment's
  // stable right anchor point directly.
  if (of === this.projectionFrameCount) {
    anchoringStrip = this.tail!
    anchorDiff =
      (anchoringStrip.fragmentStart ?? 0) +
      Math.abs(anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff)
  } else {
    // The Frame currently at `of` moves right. Its Footage position is exactly
    // the stable logical anchor point immediately preceding it.
    anchorDiff = findFramePositionByProjectionPosition.call(this, of)
    anchoringStrip = this.gate!

    if (
      of === 1 &&
      anchoringStrip.leftStep &&
      containsAnchor(anchoringStrip, anchoringStrip.leftStep, 0, 0)
    ) {
      anchoringStrip = anchoringStrip.leftStep
      anchorDiff = Math.abs(anchoringStrip.insertionDiff)
    }
  }

  return [anchorDiff, anchoringStrip]
}
