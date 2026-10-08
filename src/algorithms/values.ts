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
  // This output array materializes the read result; original Footage remains in place.
  const values: Array<T> = []

  // Skip resolution when no Frame can be read, including the default range of an empty Projection.
  if (startAt > endWith || this.projectionFrameCount === 0) return values

  // Resolve only the initial index, then follow structural right steps through the requested range.
  // Carry any unconsumed original offset across hidden structural nodes, then add the
  // successor's own fragment start; clamp to zero once the current visible span is exhausted.
  let framePosition = findFramePositionByProjectionPosition.call(this, startAt)
  let strip: Strip<T> = this.gate
  // The requested range is inclusive, so even startAt === endWith reads one Frame.
  let remaining = endWith - startAt + 1

  // Stop when the requested count is filled or structural traversal ends.
  while (strip && remaining > 0) {
    const stripDiff = strip.fragmentDiff ?? strip.insertionDiff

    // Only positive runtime lengths contribute values; masks have already consumed their Frames.
    if (stripDiff > 0) {
      // Clip to both the remaining request and the fragment's original right boundary.
      // Adding fragmentStart translates the original Footage index into a fragment-local remainder.
      const length = Math.max(
        0,
        Math.min(
          remaining,
          stripDiff -
            framePosition +
            (strip.fragmentStart ? strip.fragmentStart : 0)
        )
      )

      // Read directly from shared Footage; iteration is over output Frames, not additional index searches.
      for (let i = 0; i < length; ++i)
        void values.push(strip.footage![framePosition + i]!)

      // Hidden Strips leave the remaining visible count unchanged.
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
