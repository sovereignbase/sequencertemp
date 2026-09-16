import { findFrameByVisibleIndex } from '../auxiliary/findFrameByVisibleIndex.js'
import type { Sequence } from '../class.js'
import type { Insertion, Strip } from '../types/type.js'

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
      const origin = this.containmentTable.get([
        strip.insertionSequencer,
        strip.insertionTime,
        0,
        0,
        0,
        1,
      ] as Insertion<T>)!

      let footageOffset = 0
      let fragment = origin

      while (fragment !== strip) {
        footageOffset += Math.abs(
          fragment.fragmentDiff ?? fragment.insertionDiff
        )

        fragment = fragment.rightFragment!
      }

      const length = Math.min(remaining, stripDiff - framePosition)

      for (let i = 0; i < length; ++i)
        values.push(strip.footage?.[footageOffset + framePosition + i])

      remaining -= length
    }

    strip = strip.rightStep
    framePosition = 0
  }

  return values
}
