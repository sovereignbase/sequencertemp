import { findFrameByProjectionPosition } from '../auxiliary/findFrameByProjectionPosition.js'
import { findFrame } from '../auxiliary/findFrame.js'
import { Projection } from '../class.js'

export function value<T>(this: Projection<T>, at: number): T | undefined {
  const framePositionRelativeToItsStrip = findFrameByProjectionPosition.call(
    this,
    at
  )

  const projectedStrip = this.gate!

  const projectedFrame = findFrame(
    projectedStrip,
    framePositionRelativeToItsStrip
  )

  return projectedStrip.footage?.[projectedFrame]
}
