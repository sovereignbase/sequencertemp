/**
 * Determines whether `data` is a non-negative safe integer.
 *
 * @param data Value to test.
 * @returns Whether `data` is a safe integer in the inclusive range
 * `0` through `2^53 - 1`.
 */
export function isPositiveNumber(data: unknown): data is number {
  return Number.isSafeInteger(data) && (data as number) >= 0
}
