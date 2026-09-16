import { describe, expect, it } from 'vitest'
import { Sequence } from '../../../src/class.js'
import type { Delta, Snapshot } from '../../../src/types/type.js'
import { deliver, expect_converged } from '../../.helpers/replica.js'

describe('concurrent replace Mask restart', () => {
  it('keeps a concurrent root outside the causal replace Mask', () => {
    const primary = new Sequence<string>(100)
    const concurrent = new Sequence<string>(101)
    const mutations: Array<Delta<string>> = [
      primary.insert(['root'], 0),
      primary.insert(['branch-0', 'branch-1', 'branch-2', 'branch-3'], 0),
      concurrent.insert(['concurrent'], 0),
      primary.insert(['replaced-head'], 0),
      primary.replace(['replacement-0', 'replacement-1'], 0, 2),
      primary.insert(['final-head'], 0),
    ]
    const empty: Snapshot<string> = [[], []]
    const ordered = deliver(empty, mutations)
    const restarted = deliver(empty, mutations, 3)
    const recreated = new Sequence<string>(102, restarted.snapshot())

    expect_converged(ordered, restarted)
    expect_converged(ordered, recreated)
    expect(ordered.values()).toEqual([
      'concurrent',
      'final-head',
      'replacement-0',
      'replacement-1',
      'branch-1',
      'branch-2',
      'branch-3',
      'root',
    ])
  })
})
