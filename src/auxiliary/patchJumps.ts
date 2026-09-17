import type { Projection } from '../class.js'

export function patchJumps<T>(
  this: Projection<T>,
  _frameDiff: number,
  _stripDiff: number
): void {
  const left = this.leftJumpToPatch
  const right = this.rightJumpToPatch

  this.leftJumpToPatch = undefined
  this.rightJumpToPatch = undefined

  if (!left || !right) return
  if (left.rightJump !== right || right.leftJump !== left) return

  left.rightJump = undefined
  right.leftJump = undefined
}
