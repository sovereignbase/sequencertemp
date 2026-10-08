import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'

import { findFramePositionByProjectionPosition } from '../auxiliary/findFramePositionByProjectionPosition.js'

/**
 * Selects the stable anchor point for a local insertion.
 *
 * A Projection position occupied by a Frame identifies the Frame that the new
 * insertion moves to the right. Its zero-based position in the original
 * insertion's zero-based Footage identifies the preceding logical anchor point.
 * At a nonzero fragment-start boundary, the preceding visible Frame's right
 * anchor point is used instead. {@link findFramePositionByProjectionPosition} provides
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
    // The nonempty local insertion path maintains a positive tail, making append an O(1) anchor lookup.
    anchoringStrip = this.tail!
    // TAIL MUST NEVER BE A REDUCING STRIP NOR FRAGMENT
    // Use the original offset plus retained tail length; visible Projection length is a different coordinate.
    anchorDiff =
      (anchoringStrip.fragmentStart ?? 0) +
      Math.abs(anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff)
  } else {
    // Resolve the insertion boundary in the original Insertion's coordinates.
    anchorDiff = findFramePositionByProjectionPosition.call(this, of, true)
    // The resolver selects the anchoring fragment as part of the same traversal.
    anchoringStrip = this.gate!
  }

  return [anchorDiff, anchoringStrip]
}
