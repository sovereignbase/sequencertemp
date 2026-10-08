import { findFramePositionByProjectionPosition } from '../auxiliary/findFramePositionByProjectionPosition.js'
import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'

/**
 * Returns values from an inclusive visible range.
 *
 * @param this Projection to read.
 * @param startAt First included position; defaults to 0.
 * @param endWith Last included position; defaults to the last visible position.
 * @returns A new values array, or an empty array for an empty range.
 */
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
          stripDiff -
            framePosition +
            (strip.fragmentStart ? strip.fragmentStart : 0)
        )
      )

      for (let i = 0; i < length; ++i)
        void values.push(strip.footage![framePosition + i]!)

      remaining -= length
    }

    framePosition =
      (strip.rightStep?.fragmentStart ? strip.rightStep.fragmentStart : 0) +
      Math.max(
        0,
        framePosition -
          (strip.fragmentStart ? strip.fragmentStart : 0) -
          Math.max(0, stripDiff)
      )
    strip = strip.rightStep
  }

  return values
}
