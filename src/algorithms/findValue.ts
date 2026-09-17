import { findFrameByVisibleIndex } from '../auxiliary/findFrameByVisibleIndex.js'
import { findAnchorFrame } from '../auxiliary/findAnchorFrame.js'
import { Sequence } from '../class.js'

export function findValue<T>(this: Sequence<T>, at: number): T | undefined {
  const targetFramePosition = findFrameByVisibleIndex.call(this, at)
  const projectedStrip = this.projected!
  const projectedFrame = findAnchorFrame(projectedStrip, targetFramePosition)

  return projectedStrip.footage?.[projectedFrame - 1]
}
