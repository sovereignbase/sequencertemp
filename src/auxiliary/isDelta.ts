/**
 * Runtime validation of transferable Delta entries.
 *
 * @module
 */

import type { Delta } from '../types/type.js'

const isSafeInteger = Number.isSafeInteger

/**
 * Checks whether the transferable Delta is an Insertion or Acknowledgement.
 *
 * An acknowledgement is encoded as:
 * `[actorID, sessionID, sessionTime, sessionID, sessionTime, ...]`.
 *
 * An insertion contains six required safe integers followed by optional
 * Footage. `insertionDiff` must be non-zero because every insertion has either
 * an increasing or decreasing effect on the Projection.
 *
 * @typeParam T Value represented by a single Frame.
 * @param data Value to validate.
 * @returns Whether `data` has the transferable Delta shape.
 */
export function isDelta<T>(data: unknown): data is Delta<T> {
  if (!Array.isArray(data) || data.length === 0) return false

  const length = data.length

  // Insertion without Footage.
  if (length === 6) {
    return (
      isSafeInteger(data[0]) &&
      isSafeInteger(data[1]) &&
      isSafeInteger(data[2]) &&
      isSafeInteger(data[3]) &&
      isSafeInteger(data[4]) &&
      isSafeInteger(data[5]) &&
      data[5] !== 0
    )
  }

  // Insertion with optional Footage. An Acknowledgement may also have
  // seven entries, so the final entry distinguishes the two shapes.
  if (length === 7 && (data[6] === undefined || Array.isArray(data[6]))) {
    return (
      isSafeInteger(data[0]) &&
      isSafeInteger(data[1]) &&
      isSafeInteger(data[2]) &&
      isSafeInteger(data[3]) &&
      isSafeInteger(data[4]) &&
      isSafeInteger(data[5]) &&
      data[5] !== 0
    )
  }

  // Acknowledgement: Actor followed by repeating (sessionID, sessionTime) pairs.
  if ((length & 1) === 0) return false

  for (let i = 0; i < length; ++i) if (!isSafeInteger(data[i])) return false

  return true
}
