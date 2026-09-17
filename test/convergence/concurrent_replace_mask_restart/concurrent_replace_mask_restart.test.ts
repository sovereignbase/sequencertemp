import { describe, expect, it } from 'vitest'
import { Sequence } from '../../../src/class.js'
import type { Gossip, Snapshot } from '../../../src/types/type.js'
import { deliver, expect_converged } from '../../.helpers/replica.js'

describe('concurrent replace Mask restart', () => {
  it('keeps a concurrent root outside the causal replace Mask', () => {
    const primary = new Sequence<string>(100)
    const concurrent = new Sequence<string>(101)
    const mutations: Array<Gossip<string>> = [
      primary.insert(['root'], 0),
      primary.insert(['branch-0', 'branch-1', 'branch-2', 'branch-3'], 0),
      concurrent.insert(['concurrent'], 0),
      primary.insert(['replaced-head'], 0),
      primary.replace(['replacement-0', 'replacement-1'], 0, 1),
      primary.insert(['final-head'], 0),
    ]
    const empty: Snapshot<string> = [[], []]
    const ordered = deliver(empty, mutations)
    const restarted = deliver(empty, mutations, 3)

    expect_converged(ordered, restarted)
    expect(new Set(ordered.values())).toEqual(
      new Set([
        'concurrent',
        'final-head',
        'replacement-0',
        'replacement-1',
        'branch-1',
        'branch-2',
        'branch-3',
        'root',
      ])
    )
  })
})
