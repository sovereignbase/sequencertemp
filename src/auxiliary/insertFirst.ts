import type { Sequence } from '../class.js'
import type { Strip } from '../types/type.js'

export function insertFirst<T>(
  this: Sequence<T>,
  strip: Exclude<Strip<T>, undefined>
): void {
  strip.leftStep = undefined
  strip.leftJump = undefined
  strip.leftJumpFrameCount = 0
  strip.leftJumpStripCount = 0

  strip.rightStep = undefined
  strip.rightJump = undefined
  strip.rightJumpFrameCount = 0
  strip.rightJumpStripCount = 0

  this.head = strip
  this.gate = strip
  this.tail = strip

  this.structuralStripCount = 1
  this.visibleFrameCount += strip.fragmentDiff ?? strip.insertionDiff
  this.visibleIndex = 0

  this.leftJumpToPatch = undefined
  this.rightJumpToPatch = undefined
}
