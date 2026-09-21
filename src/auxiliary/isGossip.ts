import type { Acknowledgement, Gossip, Insertion } from '../types/type.js'

/**
 * Cached reference used by the runtime type guards below.
 *
 * `Number.isSafeInteger` rejects non-numbers, fractional values, infinities,
 * NaN, and integers outside JavaScript's exactly representable integer range.
 */
const isSafeInteger = Number.isSafeInteger

/**
 * Determines whether an unknown value has the runtime representation of an
 * {@link Insertion}.
 *
 * An Insertion is represented as a tuple containing six required integer
 * fields and an optional seventh `footage` field:
 *
 * - the tuple length must be either 6 or 7;
 * - each of the first six fields must be a safe integer;
 * - `insertionDiff` at index 5 must be non-zero;
 * - when present, `footage` at index 6 must be either `undefined` or an Array.
 *
 * This guard validates only the serialized/runtime shape required to safely
 * interpret the value as an Insertion. It does not validate higher-level
 * structural or causal invariants between the fields.
 *
 * @param data Value to validate.
 * @returns Whether `data` has the runtime representation of an Insertion.
 */
export function isInsertion<T>(data: unknown): data is Insertion<T> {
  // An Insertion always contains six required fields and may contain footage
  // as its seventh field.
  if (!Array.isArray(data) || (data.length !== 6 && data.length !== 7))
    return false

  // All structural metadata must be exactly representable integer values.
  // An insertion with zero effect is not a valid Insertion.
  if (
    !isSafeInteger(data[0]) ||
    !isSafeInteger(data[1]) ||
    !isSafeInteger(data[2]) ||
    !isSafeInteger(data[3]) ||
    !isSafeInteger(data[4]) ||
    !isSafeInteger(data[5]) ||
    data[5] === 0
  )
    return false

  // The optional footage field may be omitted, explicitly undefined, or an
  // Array containing the inserted values.
  return data.length === 6 || data[6] === undefined || Array.isArray(data[6])
}

/**
 * Determines whether an unknown value has the runtime representation of an
 * {@link Acknowledgement}.
 *
 * An Acknowledgement is encoded as an odd-length integer tuple:
 *
 * `[actor, session, time, session, time, ...]`
 *
 * The first value identifies the acknowledging actor and every following pair
 * describes an acknowledged Session and its logical time. Consequently:
 *
 * - the tuple must contain at least the actor identifier;
 * - its total length must be odd;
 * - every field must be a safe integer.
 *
 * An actor-only Acknowledgement is therefore valid and represents an
 * acknowledgement containing no Session/time pairs.
 *
 * This guard validates the encoded shape only. It does not verify semantic
 * properties such as whether referenced actors or Sessions are known.
 *
 * @param data Value to validate.
 * @returns Whether `data` has the runtime representation of an Acknowledgement.
 */
export function isAcknowledgement(data: unknown): data is Acknowledgement {
  // One actor identifier followed by zero or more Session/time pairs always
  // produces a non-empty tuple with an odd number of fields.
  if (!Array.isArray(data) || data.length < 1 || (data.length & 1) === 0)
    return false

  // Every identifier and logical time must be an exactly representable integer.
  for (let i = 0; i < data.length; ++i)
    if (!isSafeInteger(data[i])) return false

  return true
}

/**
 * Determines whether an unknown value has the runtime representation of
 * {@link Gossip}.
 *
 * Gossip is the wire-level union of {@link Insertion} and
 * {@link Acknowledgement}. Because both variants are represented as Arrays,
 * their tuple shape is used to discriminate between them.
 *
 * Insertion has a uniquely constrained shape:
 *
 * - exactly 6 fields; or
 * - exactly 7 fields where the seventh field is `undefined` or an Array.
 *
 * Values matching either of those shapes are validated as Insertions.
 * Everything else is validated as an Acknowledgement.
 *
 * This ordering is significant for seven-field tuples because an
 * Acknowledgement may itself contain seven integer fields. Such a tuple is
 * interpreted as an Acknowledgement unless its seventh field has the
 * Insertion footage representation.
 *
 * @param data Value to validate.
 * @returns Whether `data` has the runtime representation of valid Gossip.
 */
export function isGossip<T>(data: unknown): data is Gossip<T> {
  // Neither Gossip variant has an empty Array representation.
  if (!Array.isArray(data) || data.length === 0) return false

  // Six fields can represent an Insertion but cannot represent an
  // Acknowledgement, whose encoded length is always odd.
  if (data.length === 6) return isInsertion<T>(data)

  // A seven-field Insertion is distinguished from a seven-field
  // Acknowledgement by the optional footage field.
  if (data.length === 7 && (data[6] === undefined || Array.isArray(data[6])))
    return isInsertion<T>(data)

  // Any remaining shape can only be Gossip if it is a valid Acknowledgement.
  return isAcknowledgement(data)
}
