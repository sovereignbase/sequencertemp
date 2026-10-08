/**
 * Returns a cryptographically random unsigned 53-bit integer.
 *
 * @returns An integer in `0..Number.MAX_SAFE_INTEGER`, inclusive.
 */
export function getRandom53bitNumber(): number {
  // Seven bytes provide 56 random bits; mask the extra three bits to fit exact JavaScript integer precision.
  const bytes = new Uint8Array(7)
  // Fill bytes from the platform random source; Session collision avoidance is handled by create.
  crypto.getRandomValues(bytes)

  bytes[0] &= 0x1f // keep only 5 bits: 5 + 6*8 = 53

  let value = 0

  // Accumulate in base 256 rather than bitwise shifts, which truncate JavaScript numbers to 32 bits.
  for (const byte of bytes) value = value * 256 + byte

  return value
}
