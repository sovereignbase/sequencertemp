import type { Sequence } from '../class.js'

export function patchJumps<T>(
  this: Sequence<T>,
  frameDiff: number,
  stripDiff: number
): void {
  const left = this.leftJumpToPatch
  const right = this.rightJumpToPatch

  this.leftJumpToPatch = undefined
  this.rightJumpToPatch = undefined

  if (!left || !right) return
  if (left.rightJump !== right || right.leftJump !== left) return

  const frameCount = left.rightJumpFrameCount! + frameDiff
  const stripCount = left.rightJumpStripCount! + stripDiff

  left.rightJumpFrameCount = frameCount
  left.rightJumpStripCount = stripCount

  right.leftJumpFrameCount = frameCount
  right.leftJumpStripCount = stripCount
}
