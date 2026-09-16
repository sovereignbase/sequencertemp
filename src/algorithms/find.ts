import { findFrameByVisibleIndex } from '../auxiliary/findFrameByVisibleIndex.js'
import { findAnchorFrame } from '../auxiliary/findAnchorFrame.js'
import { Sequence } from '../class.js'

export function find<T>(this: Sequence<T>, index: number): T | undefined {
  const targetFramePosition = findFrameByVisibleIndex.call(this, index)
  const strip = this.gate!
  const anchorFrame = findAnchorFrame(strip, targetFramePosition)

  return strip.footage?.[anchorFrame - 1]
}
