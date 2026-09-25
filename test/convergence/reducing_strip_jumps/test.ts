import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.ts'
import type { Gossip, Strip } from '../../../src/types/type.ts'
import { deliver, expect_converged } from '../../.helpers/replica.ts'

/**
 * Verifies every right jump against the Structural Order it skips.
 *
 * Reducing Strips remain fully jumpable and contribute to Strip distance, but
 * their own Projection Frame effect is always zero.
 *
 * Returns whether at least one verified jump crossed a reducing Strip.
 */
const verifyJumps = <T>(projection: Projection<T>): boolean => {
  let crossedReducingStrip = false

  for (let left: Strip<T> = projection.head; left; left = left.rightStep) {
    const right = left.rightJump
    if (!right) continue

    let cursor: Strip<T> = left
    let frameCount = 0
    let stripCount = 0
    let containsReducingStrip = false

    while (cursor && cursor !== right) {
      const diff = cursor.fragmentDiff ?? cursor.insertionDiff

      // Reducing Strips are traversable but have no direct Frame effect.
      if (diff < 0) containsReducingStrip = true
      else frameCount += diff

      ++stripCount
      cursor = cursor.rightStep
    }

    expect(cursor).toBe(right)

    expect(left.rightJumpFrameCount).toBe(frameCount)
    expect(left.rightJumpStripCount).toBe(stripCount)

    expect(right.leftJump).toBe(left)
    expect(right.leftJumpFrameCount).toBe(frameCount)
    expect(right.leftJumpStripCount).toBe(stripCount)

    if (containsReducingStrip) crossedReducingStrip = true
  }

  return crossedReducingStrip
}

describe('reducing strip jumps', () => {
  /**
   * Verifies that reducing Strips remain part of traversal jumps without
   * contributing a negative Frame distance.
   *
   * The workload creates overlapping positive and reducing structural regions
   * and reconstructs them in ordered, hostile, and restarted delivery paths.
   *
   * All paths must converge, and traversal optimization must be allowed to span
   * reducing Strips. Those Strips contribute normally to `StripCount`, while
   * their contribution to `FrameCount` is exactly zero.
   */
  it('jumps across reducing Strips with zero Frame effect', () => {
    const seed = new Projection<string>(1)
    seed.insert(['base'], 0)

    const sequence = seed.sequence()

    const first = new Projection<string>(100, sequence)
    const second = new Projection<string>(101, sequence)

    const mutations: Array<Gossip<string>> = [
      second.insert(['branch-0', 'branch-1'], 1),
      second.replace(['replacement-0', 'replacement-1'], 1, 2),
      first.remove(0, 0),
      second.remove(0, 0),
      first.insert(['final-0', 'final-1', 'final-2'], 0),
      second.remove(0, 0),
    ]

    const ordered = deliver(sequence, mutations)

    const hostileMutations = [
      mutations[1],
      mutations[5],
      mutations[3],
      mutations[0],
      mutations[4],
      mutations[2],
    ]

    const hostile = deliver(sequence, hostileMutations)
    const restarted = deliver(sequence, hostileMutations, 3)

    // Reducing Strips must not prevent jump construction in any reconstruction.
    expect(verifyJumps(ordered)).toBe(true)
    expect(verifyJumps(hostile)).toBe(true)
    expect(verifyJumps(restarted)).toBe(true)

    // Jump topology is only an optimization; delivery and restart must still
    // resolve the exact same Projection.
    expect_converged(ordered, hostile)
    expect_converged(ordered, restarted)

    expect(ordered.projectionFrameCount).toBe(3)
  })
})
