import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'
import { linkJumps } from './linkJumps.js'

/**
 * Patches the traversal jump spanning a structural mutation.
 *
 * The preceding lookup makes the anchoring Strip a jump endpoint. Its
 * outgoing span receives the edit's visible and structural effects, then
 * is divided at the incoming Strip without another traversal.
 *
 * @param this Projection whose traversal jump is being patched.
 * @param frameDiff Change in Projection Frames within the jump span.
 * @param stripDiff Change in Structural Order Strips within the jump span.
 * @param incoming Strip placed at the resolved local boundary.
 */
export function patchJumps<T>(
  this: Projection<T>,
  frameDiff: number,
  stripDiff: number,
  incoming: NonNullable<Strip<T>>
): void {
  // Without a predecessor there is no left span to patch.
  const predecessor = incoming.leftStep
  if (!predecessor) return
  // Competition can place the edit inside the selected span, beyond its left endpoint.
  // Only that span loses its shortcut; ordinary edits retain and divide their distances.
  const left = this.leftJumpToPatch
  const right = this.rightJumpToPatch
  if (
    !predecessor.leftJump &&
    !predecessor.rightJump &&
    left &&
    right &&
    left.rightJump === right
  ) {
    left.rightJump = undefined
    right.leftJump = undefined
  }
  const rightJump = predecessor.rightJump
  const leftFrames = Math.max(
    0,
    predecessor.fragmentDiff ?? predecessor.insertionDiff
  )

  // Add the edit once, then divide at the predecessor's retained visible length.
  // Structural growth includes the incoming Strip and any new right fragment.
  if (rightJump)
    linkJumps(
      incoming,
      rightJump,
      predecessor.rightJumpFrameCount! + frameDiff - leftFrames,
      predecessor.rightJumpStripCount! + stripDiff - 1
    )
  // Coalesce hidden predecessors so repeated replacements retain one zero-Frame span.
  const leftJump = predecessor.leftJump
  if (leftJump && leftFrames === 0 && predecessor.leftJumpFrameCount === 0)
    linkJumps(leftJump, incoming, 0, predecessor.leftJumpStripCount! + 1)
  else linkJumps(predecessor, incoming, leftFrames, 1)
  // A split can move the visible boundary into the adjacent right fragment.
  const boundary = incoming.rightStep
  if (
    boundary &&
    (boundary === this.head || boundary === this.tail) &&
    incoming.rightJump !== boundary
  ) {
    const right = incoming.rightJump
    const frames = Math.max(0, incoming.fragmentDiff ?? incoming.insertionDiff)
    if (right)
      linkJumps(
        boundary,
        right,
        incoming.rightJumpFrameCount! - frames,
        incoming.rightJumpStripCount! - 1
      )
    linkJumps(incoming, boundary, frames, 1)
  }
  this.leftJumpToPatch = incoming
  this.rightJumpToPatch = incoming.rightJump
}
