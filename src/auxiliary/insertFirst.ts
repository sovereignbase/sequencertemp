import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'

/**
 * Covers insertion of all Strips into an empty Projection,
 * A.K.A. a Projection with a structural Strip count of 0.
 *
 * @param this Projection receiving the Strip.
 * @param strip Strip to insert.
 */
export function insertFirst<T>(
  this: Projection<T>,
  strip: Exclude<Strip<T>, undefined>
): void {
  // The initialized node has no structural predecessor or traversal span.
  strip.leftStep = undefined
  strip.leftJump = undefined
  strip.leftJumpFrameCount = 0
  strip.leftJumpStripCount = 0

  // Likewise clear successors and jumps so no previous graph links are inherited.
  strip.rightStep = undefined
  strip.rightJump = undefined
  strip.rightJumpFrameCount = 0
  strip.rightJumpStripCount = 0

  // One initial node supplies all structural, visible, and traversal references.
  this.structuralHead = strip
  this.head = strip
  this.gate = strip
  this.tail = strip

  // Count the single node physically, but use its runtime effect for visible length.
  this.structuralStripCount = 1
  this.projectionFrameCount += strip.fragmentDiff ?? strip.insertionDiff
  // The initialized graph begins at visible zero; no traversal is required to find that start.
  this.projectedPosition = 0
  this.gatePosition = 0

  // There is no spanning jump to patch after initializing a single-node graph.
  this.leftJumpToPatch = undefined
  this.rightJumpToPatch = undefined
}
