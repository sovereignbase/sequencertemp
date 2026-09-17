import type { Sequence } from '../class.js'

export function patchJumps<T>(
  this: Sequence<T>,
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
