import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'

import { findFramePositionByProjectionPosition } from '../auxiliary/findFramePositionByProjectionPosition.js'
import { containsAnchor } from './containsAnchor.js'

/**
 * Selects the structural anchor for an insertion at a Projection position.
 *
 * The requested Projection position is resolved into:
 *
 * `[anchorFramePosition, anchoringStrip]`
 *
 * where `anchoringStrip` identifies the Strip containing the anchor and
 * `anchorFramePosition` identifies the Frame position within that Strip.
 *
 * Positions inside the Projection are resolved through
 * {@link findFrameByProjectionPosition}. When the requested position falls
 * exactly on a boundary between two Strips, the boundary is normally
 * represented canonically as Frame position `0` of the right Strip rather
 * than as the end of the left Strip.
 *
 * The left Strip remains the anchor when the right Strip is itself anchored
 * to that Strip. In that case moving the anchor to the right would cross into
 * an existing subtree rather than represent the structural boundary preceding
 * it.
 *
 * The Projection tail is handled separately because
 * `of === projectionFrameCount` refers to the position immediately after the
 * final projected Frame. In that case the tail Strip becomes the anchor and
 * its full current fragment length becomes the anchor Frame position.
 *
 * @param this Projection receiving the insertion.
 * @param of Projection position at which the insertion is anchored.
 * @returns Anchor Frame position and the Strip providing the structural anchor.
 */
export function selectAnchor<T>(
  this: Projection<T>,
  of: number
): [number, Strip<T>] {
  // covers all cases, frameposition in 0 based footage + 1 will always return the corerct anchor diff
  let anchorDiff: number =
    findFramePositionByProjectionPosition.call(this, of === 0 ? 0 : of - 1) + 1
  let anchoringStrip: NonNullable<Strip<T>> = this.gate!

  // At a Strip boundary, move the anchor to position zero of the right Strip
  // when the right Strip is anchored to the left Strip.
  if (
    anchoringStrip.rightStep &&
    anchorDiff ==
      Math.abs(anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff) &&
    containsAnchor(
      anchoringStrip,
      anchoringStrip.rightStep,
      anchoringStrip.insertionDiff,
      anchoringStrip.insertionDiff
    )
  ) {
    anchorDiff = 0
    anchoringStrip = anchoringStrip.rightStep
  }

  return [anchorDiff, anchoringStrip]
}
