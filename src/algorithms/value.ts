import { findFramePositionByProjectionPosition } from '../auxiliary/findFramePositionByProjectionPosition.js'
import { Projection } from '../class.js'

/**
 * Reads the Footage value at a visible Projection position.
 *
 * @param this Projection to read.
 * @param at Valid visible Frame index.
 * @returns The corresponding Footage value.
 */
export function value<T>(this: Projection<T>, at: number): T | undefined {
  const framePosition = findFramePositionByProjectionPosition.call(this, at)
  return this.gate?.footage?.[framePosition]
}
