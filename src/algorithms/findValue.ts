import { findFrameByVisibleIndex } from '../auxiliary/findFrameByVisibleIndex.js'
import { findAnchorFrame } from '../auxiliary/findAnchorFrame.js'
import { Sequence } from '../class.js'

export function findValue<T>(this: Sequence<T>, at: number): T | undefined {
  const targetFramePosition = findFrameByVisibleIndex.call(this, at)
  const strip = this.gate!
  const anchorFrame = findAnchorFrame(strip, targetFramePosition)

  return strip.footage?.[anchorFrame - 1]
}
