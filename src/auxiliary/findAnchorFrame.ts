import type { Strip } from '../types/type.js'

export function findAnchorFrame<T>(
  strip: NonNullable<Strip<T>>,
  targetFramePosition: number
): number {
  let remaining = 0
  let fragment: Strip<T> = strip

  while (fragment) {
    remaining += Math.abs(fragment.fragmentDiff ?? fragment.insertionDiff)
    fragment = fragment.rightFragment
  }

  return Math.abs(strip.insertionDiff) - remaining + targetFramePosition
}
