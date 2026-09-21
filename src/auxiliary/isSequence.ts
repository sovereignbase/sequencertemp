import { isAcknowledgement, isInsertion } from './isGossip.js'
import type { Sequence } from '../types/type.js'

/**
 * Determines whether an unknown value has the runtime representation of a
 * {@link Sequence}.
 *
 * A Sequence is represented as a two-element tuple:
 *
 * `[frontiers, projection]`
 *
 * where:
 *
 * - `frontiers` is an Array of {@link Acknowledgement} values;
 * - `projection` is an Array of {@link Insertion} values.
 *
 * Both Arrays may be empty. Every contained value is validated individually
 * using the corresponding runtime type guard.
 *
 * This guard validates the serialized/runtime shape of the Sequence only.
 * It does not verify higher-level invariants between acknowledgements,
 * insertions, or their ordering within the Sequence.
 *
 * @param data Value to validate.
 * @returns Whether `data` has the runtime representation of a Sequence.
 */
export function isSequence<T>(data: unknown): data is Sequence<T> {
  // A Sequence always consists of exactly two fields:
  // its frontiers and its Projection.
  if (!Array.isArray(data) || data.length !== 2) return false

  const frontiers = data[0]
  const projection = data[1]

  // Both Sequence components are encoded as Arrays.
  if (!Array.isArray(frontiers) || !Array.isArray(projection)) return false

  // Every frontier entry must have the runtime representation of an
  // Acknowledgement.
  for (let i = 0; i < frontiers.length; ++i)
    if (!isAcknowledgement(frontiers[i])) return false

  // Every Projection entry must have the runtime representation of an
  // Insertion.
  for (let i = 0; i < projection.length; ++i)
    if (!isInsertion<T>(projection[i])) return false

  return true
}
