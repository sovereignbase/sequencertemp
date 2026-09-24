import { findFrameByProjectionPosition } from '../auxiliary/findFrameByProjectionPosition.js'
import { findFrame } from '../auxiliary/findFrame.js'
import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'

export function values<T>(
  this: Projection<T>,
  startAt: number = 0,
  endWith: number = this.projectionFrameCount - 1
): Array<T | undefined> {
  const values: Array<T> = []

  if (startAt > endWith || this.projectionFrameCount === 0) return values

  let framePosition = findFrameByProjectionPosition.call(this, startAt)
  let strip: Strip<T> = this.gate
  let remaining = endWith - startAt + 1

  while (strip && remaining > 0) {
    const stripDiff = strip.fragmentDiff ?? strip.insertionDiff

    if (stripDiff > 0) {
      const anchorFrame = findFrame(strip, framePosition)

      const length = Math.max(0, Math.min(remaining, stripDiff - framePosition))

      for (let i = 0; i < length; ++i)
        void values.push(strip.footage![anchorFrame + i]!)

      remaining -= length
    }

    strip = strip.rightStep
    framePosition = Math.max(0, framePosition - stripDiff)
  }

  return values
}
