import { findFrameByVisibleIndex } from '../auxiliary/findFrameByVisibleIndex.js'
import { findAnchorFrame } from '../auxiliary/findAnchorFrame.js'
import type { Sequence } from '../class.js'
import type { Strip } from '../types/type.js'

export function findValues<T>(
  this: Sequence<T>,
  startAt: number = 0,
  endWith: number = this.visibleFrameCount - 1
): Array<T | undefined> {
  const values: Array<T> = []

  if (startAt > endWith || this.visibleFrameCount === 0) return values

  let framePosition = findFrameByVisibleIndex.call(this, startAt)
  let strip: Strip<T> = this.gate
  let remaining = endWith - startAt + 1

  while (strip && remaining > 0) {
    const stripDiff = strip.fragmentDiff ?? strip.insertionDiff

    if (stripDiff > 0) {
      const anchorFrame = findAnchorFrame(strip, framePosition)

      const length = Math.max(
        0,
        Math.min(remaining, stripDiff - framePosition + 1)
      )

      for (let i = -1; i < length - 1; ++i)
        void values.push(strip.footage![anchorFrame + i]!)

      remaining -= length
    }

    strip = strip.rightStep
    framePosition = Math.max(1, framePosition - stripDiff)
  }

  return values
}
