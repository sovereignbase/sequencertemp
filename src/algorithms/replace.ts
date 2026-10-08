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
  // Sequence removal before insertion so the replacement anchors into the resulting Projection.
  return [
    ...this.remove(startAt, endWith),
    // An empty replacement is removal only; a zero-length Insertion is not valid Gossip.
    ...(withValues.length === 0 ? [] : this.insert(withValues, startAt)),
  ]
}
