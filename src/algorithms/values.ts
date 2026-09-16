import { findFrameByVisibleIndex } from '../auxiliary/findFrameByVisibleIndex.js'
import { findOriginalFramePosition } from '../auxiliary/findOriginalFramePosition.js'
import type { Sequence } from '../class.js'
import type { Strip } from '../types/type.js'

export function values<T>(
  this: Sequence<T>,
  startAt: number = 0,
  endAt: number = this.visibleFrameCount
): Array<T | undefined> {
  const values: Array<T | undefined> = []

  if (startAt >= endAt || this.visibleFrameCount === 0) return values

  let framePosition = findFrameByVisibleIndex.call(this, startAt)
  let strip: Strip<T> = this.gate
  let remaining = endAt - startAt

  while (strip && remaining > 0) {
    const stripDiff = strip.fragmentDiff ?? strip.insertionDiff

    if (stripDiff > 0) {
      const originalFramePosition = findOriginalFramePosition(
        strip,
        framePosition
      )

      const length = Math.max(
        0,
        Math.min(remaining, stripDiff - framePosition + 1)
      )

      for (let i = 0; i < length; ++i)
        values.push(strip.footage?.[originalFramePosition + i - 1])

      remaining -= length
    }

    strip = strip.rightStep
    framePosition = Math.max(1, framePosition - stripDiff)
  }

  return values
}
