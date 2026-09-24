import { findFramePositionByProjectionPosition } from '../auxiliary/findFramePositionByProjectionPosition.js'
import { Projection } from '../class.js'

export function value<T>(this: Projection<T>, at: number): T | undefined {
  const framePosition = findFramePositionByProjectionPosition.call(this, at)
  return this.gate?.footage?.[framePosition]
}
