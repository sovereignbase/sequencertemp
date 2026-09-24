import { findFramePositionByProjectionPosition } from '../auxiliary/findFramePositionByProjectionPosition.js'
import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'

export function values<T>(
  this: Projection<T>,
  startAt: number = 0,
  endWith: number = this.projectionFrameCount - 1
): Array<T | undefined> {
  const values: Array<T> = []

  if (startAt > endWith || this.projectionFrameCount === 0) return values

  let framePosition = findFramePositionByProjectionPosition.call(this, startAt)
  let strip: Strip<T> = this.gate
  let remaining = endWith - startAt + 1

  while (strip && remaining > 0) {
    const stripDiff = strip.fragmentDiff ?? strip.insertionDiff

    if (stripDiff > 0) {
      const length = Math.max(
        0,
        Math.min(
          remaining,
          stripDiff - framePosition + (strip.fragmentStart ?? 0)
        )
      )

      for (let i = 0; i < length; ++i)
        void values.push(strip.footage![framePosition + i]!)

      remaining -= length
    }

    framePosition =
      (strip.rightStep?.fragmentStart ?? 0) +
      Math.max(
        0,
        framePosition - (strip.fragmentStart ?? 0) - stripDiff
      )
    strip = strip.rightStep
  }

  return values
}
