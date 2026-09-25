import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.ts'

describe('sequence jump preoptimization', () => {
  /**
   * Verifies that reconstruction from a retained Sequence prebuilds valid
   * traversal jumps at approximately square-root spacing.
   *
   * The source contains sixteen one-Frame Strips in a simple linear order.
   * Recreating a Projection from that Sequence should immediately install
   * reciprocal traversal jumps instead of requiring later lookups to discover
   * and optimize the path opportunistically.
   *
   * For this Sequence:
   *
   * - jump spacing is `round(sqrt(stripCount))`;
   * - every jump crosses exactly that many Strips;
   * - because every Strip contributes one visible Frame, each jump crosses the
   *   same number of Projection Frames;
   * - every right jump must have the matching reciprocal left jump.
   *
   * With sixteen Strips the spacing is four, producing three complete jumps
   * from the head before the remaining tail is shorter than one full jump.
   *
   * Preoptimization must not affect the reconstructed visible Projection.
   */
  it('creates valid square-root-spaced jumps during reconstruction', () => {
    // Build sixteen consecutive one-Frame Strips.
    const source = new Projection<number>(1)

    for (let value = 0; value < 16; ++value)
      source.insert([value], source.projectionFrameCount)

    const sequence = source.sequence()

    // Reconstruction should prebuild traversal jumps directly from Sequence.
    const recreated = new Projection<number>(2, sequence)
    const spacing = Math.round(Math.sqrt(sequence[1].length))

    let jump = recreated.head
    let jumpCount = 0

    // Every complete prebuilt jump must span the expected number of Strips and
    // Frames and maintain a reciprocal link in the opposite direction.
    while (jump?.rightJump) {
      expect(jump.rightJumpStripCount).toBe(spacing)
      expect(jump.rightJumpFrameCount).toBe(spacing)
      expect(jump.rightJump.leftJump).toBe(jump)

      jump = jump.rightJump
      ++jumpCount
    }

    // Sixteen Strips with spacing four produce three complete forward jumps:
    // head -> 4 -> 8 -> 12.
    expect(jumpCount).toBe(3)

    // Jump preoptimization must not change any visible Footage.
    expect(recreated.values()).toEqual(source.values())
  })
})
