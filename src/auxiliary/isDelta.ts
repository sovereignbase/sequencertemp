/**
 * Runtime validation of transferable Delta entries.
 *
 * @module
 */

import type { Delta } from '../types/type.js'

const isSafeInteger = Number.isSafeInteger

/**
 * Checks the transferable Delta shape and safe-integer metadata.
 *
 * The acknowledgement is encoded as:
 * `[actorID, sessionID, sessionTime, sessionID, sessionTime, ...]`.
 *
 * The insertion contains six required safe integers followed by optional
 * Footage. `insertionDiff` must be non-zero because every insertion has either
 * an increasing or decreasing effect on the Projection.
 *
 * @typeParam T Value represented by a single Frame.
 * @param data Value to validate.
 * @returns Whether `data` has the transferable Delta shape.
 * @remarks This validates the transfer representation only. Structural
 * placement and dependency resolution are handled during materialization.
 */
export function isDelta<T>(data: unknown): data is Delta<T> {
  if (!Array.isArray(data) || data.length !== 2) return false

  const acknowledgement = data[0]

  if (
    !Array.isArray(acknowledgement) ||
    acknowledgement.length < 1 ||
    (acknowledgement.length & 1) === 0
  )
    return false

  for (let i = 0; i < acknowledgement.length; ++i)
    if (!isSafeInteger(acknowledgement[i])) return false

  const insertion = data[1]

  if (
    !Array.isArray(insertion) ||
    (insertion.length !== 6 && insertion.length !== 7)
  )
    return false

  if (
    !isSafeInteger(insertion[0]) ||
    !isSafeInteger(insertion[1]) ||
    !isSafeInteger(insertion[2]) ||
    !isSafeInteger(insertion[3]) ||
    !isSafeInteger(insertion[4]) ||
    !isSafeInteger(insertion[5]) ||
    insertion[5] === 0
  )
    return false

  return (
    insertion.length === 6 ||
    insertion[6] === undefined ||
    Array.isArray(insertion[6])
  )
}
