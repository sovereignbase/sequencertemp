import { findFrameByVisibleIndex } from '../auxiliary/findFrameByVisibleIndex.js'
import { findOriginalFramePosition } from '../auxiliary/findOriginalFramePosition.js'
import { Sequence } from '../class.js'

export function find<T>(this: Sequence<T>, index: number): T | undefined {
  const fragmentFramePosition = findFrameByVisibleIndex.call(this, index)
  const strip = this.gate!
  const framePosition = findOriginalFramePosition(strip, fragmentFramePosition)

  return strip.footage?.[framePosition - 1]
}
