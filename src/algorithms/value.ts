import { findFrameByProjectionPosition } from '../auxiliary/findFrameByProjectionPosition.js'
import { findFrame } from '../auxiliary/findFrame.js'
import { Sequence } from '../class.js'

export function findValue<T>(this: Sequence<T>, at: number): T | undefined {
  const framePositionRelativeToItsStrip = findFrameByProjectionPosition.call(
    this,
    at
  )

  const projectedStrip = this.gate!

  const projectedFrame = findFrame(
    projectedStrip,
    framePositionRelativeToItsStrip
  )

  return projectedStrip.footage?.[projectedFrame - 1]
}
