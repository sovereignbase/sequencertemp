/**
 * Returns a cryptographically random unsigned 53-bit integer.
 *
 * @returns An integer in `0..Number.MAX_SAFE_INTEGER`, inclusive.
 */
export function getRandom53bitNumber(): number {
  const bytes = new Uint8Array(7)
  crypto.getRandomValues(bytes)

  bytes[0] &= 0x1f // keep only 5 bits: 5 + 6*8 = 53

  let value = 0

  for (const byte of bytes) value = value * 256 + byte

  return value
}
