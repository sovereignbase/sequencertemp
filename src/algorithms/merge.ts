import { apply } from './apply.js'
import { isSequence } from '../auxiliary/isSequence.js'
import type { Projection } from '../class.js'
import type { Result } from '../types/type.js'

/**
 * Merges a validated Sequence's Insertions and acknowledgement frontiers.
 *
 * @param this Projection receiving the Sequence.
 * @param sequence Serialized Sequence to validate and merge.
 * @returns Visible changes and optional acknowledgement Gossip, or
 * `undefined` if the Sequence has an invalid runtime shape.
 */
export function merge<T>(
  this: Projection<T>,
  sequence: unknown
): Result<T> | undefined {
  // Validate the full snapshot shape before either component mutates the Projection.
  if (!isSequence<T>(sequence)) return

  const [frontiers, projection] = sequence

  // Insertions use the same duplicate, pending, and placement rules as ordinary remote Gossip.
  const result = apply.call(this, projection) as Result<T> | undefined

  // Observe received frontiers after the payload; this acknowledgement-only pass adds no Change.
  void apply.call(this, frontiers)

  // Return the payload's visible edits and generated replies, not the received frontiers.
  return result
}
