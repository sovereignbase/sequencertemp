import { describe, expect, it } from 'vitest'
import { Sequence } from '../../../src/class.js'
import type { Delta } from '../../../src/types/type.js'
import { deliver, expect_converged } from '../../.helpers/replica.js'

describe('signed mask jump', () => {
  it('walks mask debt before using a positive-distance jump', () => {
    const seed = new Sequence<string>(1)
    seed.insert(['base'], 0)
    const snapshot = seed.snapshot()
    const first = new Sequence<string>(100, snapshot)
    const second = new Sequence<string>(101, snapshot)
    const mutations: Array<Delta<string>> = [
      second.insert(['branch-0', 'branch-1'], 1),
      second.replace(['replacement-0', 'replacement-1'], 1, 3),
      first.remove(0, 1),
      second.remove(0, 1),
      first.insert(['final-0', 'final-1', 'final-2'], 0),
      second.remove(0, 1),
    ]
    const ordered = deliver(snapshot, mutations)
    const hostileMutations = [
      mutations[1], mutations[5], mutations[3],
      mutations[0], mutations[4], mutations[2],
    ]
    const hostile = deliver(snapshot, hostileMutations)
    const restarted = deliver(snapshot, hostileMutations, 3)
    const recreated = new Sequence<string>(102, hostile.snapshot())

    expect_converged(ordered, hostile)
    expect_converged(ordered, restarted)
    expect_converged(ordered, recreated)
    expect(ordered.values()).toEqual(['final-0', 'final-1', 'final-2'])
  })
})
