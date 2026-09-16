import type { Strip } from '../types/type.js'

export function findOriginalFramePosition<T>(
  strip: NonNullable<Strip<T>>,
  fragmentFramePosition: number
): number {
  let remaining = 0
  let fragment: Strip<T> = strip

  while (fragment) {
    remaining += Math.abs(fragment.fragmentDiff ?? fragment.insertionDiff)
    fragment = fragment.rightFragment
  }

  return (
    Math.abs(strip.insertionDiff) - remaining + fragmentFramePosition
  )
}
