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
  if (!isSequence<T>(sequence)) return

  const [frontiers, projection] = sequence

  const result = apply.call(this, projection) as Result<T> | undefined

  void apply.call(this, frontiers)

  return result
}
