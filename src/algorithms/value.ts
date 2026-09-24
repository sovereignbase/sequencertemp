import { findFramePositionByProjectionPosition } from '../auxiliary/findFramePositionByProjectionPosition.js'
import { Projection } from '../class.js'

export function value<T>(this: Projection<T>, at: number): T | undefined {
  return this.gate?.footage?.[
    findFramePositionByProjectionPosition.call(this, at)
  ]
}
