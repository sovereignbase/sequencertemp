export const i32Max = 2_147_483_647
export const i32Min = -2_147_483_648

/**
 * Signed WebAssembly lane validation.
 *
 * @module
 */

/**
 * Determines whether `value` is a signed 32-bit integer.
 *
 * @param value Value to test.
 * @returns Whether `value` is a safe integer in the inclusive range
 * `-2^31` through `2^31 - 1`.
 */
export function isI32(value: unknown): value is number {
  return (
    Number.isSafeInteger(value) &&
    (value as number) >= i32Min &&
    (value as number) <= i32Max
  )
}

/**
 * Runtime validation of transferable Delta entries.
 *
 * @module
 */

/**
 * Checks the transferable Delta tuple and unsigned metadata word shape.
 *
 * Projection contains complete twelve-word records. Footage is optional; native
 * merge checks whether the supplied content covers the encoded records.
 *
 * @typeParam T Value represented by a single Frame.
 * @param data Value to validate.
 * @returns Whether `data` has the transferable Delta shape.
 * @remarks This checks the transfer shape only. Native materialization resolves
 * coordinate containment and dependency availability.
 */
export function isDelta<T>(data: unknown): data is Delta<T> {
  if (!Array.isArray(data) || data.length < 1 || data.length > 2) return false

  const [header, body] = data as Delta<T>

  return (
    Array.isArray(header) &&
    header.length % 8 === 0 &&
    header.every(isI32) &&
    (body === undefined || Array.isArray(body))
  )
}

import type { Delta } from '../types/type.js'
