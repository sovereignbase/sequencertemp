import { findFrameByVisibleIndex } from '../auxiliary/findFrameByVisibleIndex.js'
import { Sequence } from '../class.js'
import type { Insertion } from '../types/type.js'

export function find<T>(this: Sequence<T>, index: number): T | undefined {
  const framePosition = findFrameByVisibleIndex.call(this, index)
  const strip = this.gate!
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

  return strip.footage?.[footageOffset + framePosition - 1]
}
