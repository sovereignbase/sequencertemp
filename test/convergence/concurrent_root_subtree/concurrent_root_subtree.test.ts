import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.js'
import type { Gossip, Snapshot } from '../../../src/types/type.js'
import { deliver, expect_converged } from '../../.helpers/replica.js'

describe('concurrent root subtree', () => {
  it('orders a complete concurrent subtree delivered before the other root', () => {
    const primary = new Projection<string>(100)
    const concurrent = new Projection<string>(101)
    const mutations: Array<Gossip<string>> = [
      primary.insert(['primary-root'], 0),
      concurrent.insert(['concurrent-root'], 0),
      primary.insert(['primary-2'], 0),
      primary.insert(['primary-3'], 0),
      concurrent.insert(['concurrent-4'], 0),
      primary.insert(['primary-5'], 0),
    ]
    const empty: Snapshot<string> = [[], []]
    const ordered = deliver(empty, mutations)
    const hostile = deliver(empty, [
      mutations[1],
      mutations[4],
      mutations[0],
      mutations[2],
      mutations[3],
      mutations[5],
    ])

    expect_converged(ordered, hostile)
    expect(new Set(ordered.values())).toEqual(
      new Set([
        'concurrent-4',
        'concurrent-root',
        'primary-5',
        'primary-3',
        'primary-2',
        'primary-root',
      ])
    )
  })
})
