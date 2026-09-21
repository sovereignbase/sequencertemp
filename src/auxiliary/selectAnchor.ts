import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'

import { findFrameByProjectionPosition } from '../auxiliary/findFrameByProjectionPosition.js'
import { anchorOfStrip } from './anhorOfStrip.js'

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
  let anchorFramePosition: number
  let anchoringStrip: NonNullable<Strip<T>>

  // The Projection end lies immediately after the final projected Frame and
  // therefore cannot be resolved through the normal in-Projection lookup.
  if (of === this.projectionFrameCount) {
    anchoringStrip = this.tail!

    // Anchor at the end of the tail Strip's current fragment.
    anchorFramePosition = Math.abs(
      anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff
    )

    // No traversal was required, so there are no surrounding jump links to
    // preserve for later patching.
    this.leftJumpToPatch = undefined
    this.rightJumpToPatch = undefined
  } else {
    // Resolve the Projection position and use the resulting gate as its
    // structural anchor.
    anchorFramePosition = findFrameByProjectionPosition.call(this, of)
    anchoringStrip = this.gate!

    // At a Strip boundary, move the anchor to position zero of the right Strip
    // when the right Strip is anchored to the left Strip.
    if (
      anchoringStrip.rightStep &&
      anchorFramePosition ==
        Math.abs(anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff) &&
      anchorOfStrip(anchoringStrip, anchoringStrip.rightStep)
    ) {
      anchorFramePosition = 0
      anchoringStrip = anchoringStrip.rightStep
    }
  }

  return [anchorFramePosition, anchoringStrip]
}
