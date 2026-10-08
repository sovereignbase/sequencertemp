import type { Projection } from '../class.js'
import type { Gossip } from '../types/type.js'

/**
 * Sequences removal of an inclusive range followed by insertion at its start.
 *
 * @param this Projection to edit.
 * @param withValues Replacement values; empty for removal only.
 * @param startAt First position to replace; defaults to 0.
 * @param endWith Last position to replace; defaults to the last visible position.
 * @returns Removal Gossip followed by insertion Gossip.
 */
export function replace<T>(
  this: Projection<T>,
  withValues: Array<T>,
  startAt: number = 0,
  endWith: number = this.projectionFrameCount - 1
): Gossip<T> {
  return [
    ...this.remove(startAt, endWith),
    ...(withValues.length === 0 ? [] : this.insert(withValues, startAt)),
  ]
}
