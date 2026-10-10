import type { Strip } from '../types/type.js'

/** Links two jump endpoints with matching visible and structural distances. */
export function linkJumps<T>(
  left: NonNullable<Strip<T>>,
  right: NonNullable<Strip<T>>,
  frames: number,
  strips: number
): void {
  // Replacing an endpoint also detaches its former reciprocal link.
  if (left.rightJump && left.rightJump !== right)
    left.rightJump.leftJump = undefined
  if (right.leftJump && right.leftJump !== left)
    right.leftJump.rightJump = undefined

  left.rightJump = right
  left.rightJumpFrameCount = right.leftJumpFrameCount = frames
  left.rightJumpStripCount = right.leftJumpStripCount = strips
  right.leftJump = left
}
