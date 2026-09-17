import { describe, expect, it } from 'vitest'
import { Sequence } from '../../../src/class.js'
import type { Gossip } from '../../../src/types/type.js'
import { deliver, expect_converged } from '../../.helpers/replica.js'

describe('signed mask jump', () => {
  it('walks mask debt before using a positive-distance jump', () => {
    const seed = new Sequence<string>(1)
    seed.insert(['base'], 0)
    const snapshot = seed.snapshot()
    const first = new Sequence<string>(100, snapshot)
    const second = new Sequence<string>(101, snapshot)
    const mutations: Array<Gossip<string>> = [
      second.insert(['branch-0', 'branch-1'], 1),
      second.replace(['replacement-0', 'replacement-1'], 1, 2),
      first.remove(0, 0),
      second.remove(0, 0),
      first.insert(['final-0', 'final-1', 'final-2'], 0),
      second.remove(0, 0),
    ]
    const ordered = deliver(snapshot, mutations)
    const hostileMutations = [
      mutations[1],
      mutations[5],
      mutations[3],
      mutations[0],
      mutations[4],
      mutations[2],
    ]
    const hostile = deliver(snapshot, hostileMutations)
    const restarted = deliver(snapshot, hostileMutations, 3)

    expect_converged(ordered, hostile)
    expect_converged(ordered, restarted)
    expect(ordered.projectionFrameCount).toBe(3)
  })
})
