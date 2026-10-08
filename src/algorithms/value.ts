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
  // Convert the visible index to the original Footage index; the resolver also selects gate.
  const framePosition = findFramePositionByProjectionPosition.call(this, at)
  // Read the shared array at that original index, not at a fragment-relative index.
  return this.gate?.footage?.[framePosition]
}
