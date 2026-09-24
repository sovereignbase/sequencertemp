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
  let anchorDiff: number
  let anchoringStrip: NonNullable<Strip<T>>

  // Pushing at the end of tail cant use FramePosition directly and also cannot be traversed to since the projection position does not yet exist.
  if (of === this.projectionFrameCount) {
    anchoringStrip = this.tail!
    anchorDiff =
      (anchoringStrip.fragmentStart ?? 0) +
      Math.abs(anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff)
  } else {
    // Automatically returns the right diff, because projection position (of) is bound to move right meaning, the new insertion is coming after the frame currently left of the projection position and frame position are always one less than logical positions an insertion targeting the projection position first at a strip would be anchored to the frame to the left (last frame of a strip) but since here we already know there is a strip to ther right because we are getting its footage index or frame position 0, we want to use the logical time zero reservation, where anchor diff 0.
    anchorDiff = findFramePositionByProjectionPosition.call(this, of)
    anchoringStrip = this.gate!
  }

  return [anchorDiff, anchoringStrip]
}
