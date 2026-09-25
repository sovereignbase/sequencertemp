import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.js'
import type { Gossip, Sequence } from '../../../src/types/type.js'
import { deliver, expect_converged } from '../../.helpers/replica.js'

describe('concurrent root sequence', () => {
  it('recreates three concurrent root subtrees in deterministic order', () => {
    const primary = new Projection<string>(100)
    const second = new Projection<string>(101)
    const third = new Projection<string>(102)
    const mutations: Array<Gossip<string>> = [
      primary.insert(['primary-root'], 0),
      primary.insert(['primary-1'], 0),
      second.insert(['second-root'], 0),
      third.insert(['third-root'], 0),
      primary.insert(['primary-4'], 0),
      primary.insert(['primary-5'], 0),
    ]
    const empty: Sequence<string> = [[], []]
    const ordered = deliver(empty, mutations)
    const recreated = new Projection<string>(103, ordered.sequence())

    expect_converged(ordered, recreated)
    expect(new Set(ordered.values())).toEqual(
      new Set([
        'third-root',
        'second-root',
        'primary-5',
        'primary-4',
        'primary-1',
        'primary-root',
      ])
    )
  })
})
