import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'

import { findFrameByProjectionPosition } from '../auxiliary/findFrameByProjectionPosition.js'

/**
 *
 * @param this
 * @param of projection position reciving an insertion
 * @returns
 */
export function selectAnchor<T>(
  this: Projection<T>,
  of: number
): [number, Strip<T>] {
  let anchorFramePosition: number
  let anchoringStrip: NonNullable<Strip<T>>

  if (of === this.projectionFrameCount) {
    anchoringStrip = this.tail!
    anchorFramePosition = Math.abs(
      anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff
    )
    this.leftJumpToPatch = undefined
    this.rightJumpToPatch = undefined
  } else {
    anchorFramePosition = findFrameByProjectionPosition.call(this, of)
    anchoringStrip = this.gate!

    // Use a boundary marker when at an strip boundary between strips.
    if (
      anchoringStrip.rightStep &&
      anchorFramePosition ==
        Math.abs(anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff)
    ) {
      anchorFramePosition = 0
      anchoringStrip = anchoringStrip.rightStep
    }
  }

  return [anchorFramePosition, anchoringStrip]
}
