import type { Projection } from '../class.js'

/**
 * Patches the traversal jump spanning a structural mutation.
 *
 * Traversals cache the jump crossing the mutation position in
 * `leftJumpToPatch` and `rightJumpToPatch`. After the mutation, this helper
 * adjusts the cached distances of that jump to reflect the changed span.
 *
 * `frameDiff` is applied to the number of Projection Frames crossed by the
 * jump. Reducing Strips may decrease this distance, but cannot make it
 * negative: negative Strip lengths have already been consumed by splitting
 * and do not consume additional Projection Frames during traversal.
 * Consequently, the resulting Frame count is clamped to zero.
 *
 * `stripDiff` is applied independently to the number of Structural Order
 * Strips crossed by the jump. All Strips, including reducing Strips, remain
 * part of Structural Order and therefore contribute to this count.
 *
 * Both directions of the reciprocal jump always receive identical patched
 * Frame and Strip counts.
 *
 * Cached patch points are consumed by this operation regardless of whether
 * the original reciprocal jump still exists. The structural mutation may have
 * already invalidated or rewired that jump, in which case no patch is applied.
 *
 * @param this Projection whose traversal jump is being patched.
 * @param frameDiff Signed change in Projection Frames within the jump span.
 * @param stripDiff Signed change in Structural Order Strips within the jump span.
 */
export function patchJumps<T>(
  this: Projection<T>,
  frameDiff: number,
  stripDiff: number
): void {
  // Consume the cached jump span selected by the traversal preceding the
  // structural mutation.
  const left = this.leftJumpToPatch
  const right = this.rightJumpToPatch

  this.leftJumpToPatch = undefined
  this.rightJumpToPatch = undefined

  // No jump crossed the mutation position.
  if (!left || !right) return

  // The cached span may already have been invalidated or rewired by the
  // structural mutation itself. Only patch the original reciprocal jump.
  if (left.rightJump !== right || right.leftJump !== left) return

  // Projection distance cannot become negative. Reducing Strips remain in
  // Structural Order but do not consume additional Projection Frames.
  const frameCount = Math.max(0, left.rightJumpFrameCount! + frameDiff)

  // Every Strip within the span contributes to Structural Order distance,
  // regardless of its Projection effect.
  const stripCount = left.rightJumpStripCount! + stripDiff

  // Patch both directions of the reciprocal jump with identical distances.
  left.rightJumpFrameCount = frameCount
  left.rightJumpStripCount = stripCount

  right.leftJumpFrameCount = frameCount
  right.leftJumpStripCount = stripCount
}
