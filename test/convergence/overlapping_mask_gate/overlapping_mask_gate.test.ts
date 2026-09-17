import { describe, expect, it } from 'vitest'
import { Sequence } from '../../../src/class.js'
import type { Gossip } from '../../../src/types/type.js'
import { deliver, expect_converged } from '../../.helpers/replica.js'

describe('overlapping mask gate', () => {
  it('keeps a head zero-reservation gate stable across signed mask debt', () => {
    const seed = new Sequence<string>(1)
    seed.insert(['base-0', 'base-1'], 0)
    const snapshot = seed.snapshot()
    const replicas = [0, 1, 2].map(
      (index) => new Sequence<string>(100 + index, snapshot)
    )
    const mutations: Array<Gossip<string>> = [
      replicas[2].remove(0, 2),
      replicas[0].insert(['middle-0', 'middle-1'], 1),
      replicas[2].insert(['tail-0', 'tail-1', 'tail-2'], 0),
      replicas[1].replace(['replacement-0', 'replacement-1'], 0, 2),
      replicas[1].remove(0, 2),
      replicas[2].remove(2, 3),
    ]
    const ordered = deliver(snapshot, mutations)
    const hostile = deliver(snapshot, [
      mutations[5],
      mutations[4],
      mutations[2],
      mutations[0],
      mutations[3],
      mutations[1],
    ])

    expect_converged(ordered, hostile)
    expect(hostile.visibleIndex).toBe(0)
  })
})
