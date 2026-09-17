import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.js'
import type { Gossip, Snapshot } from '../../../src/types/type.js'
import { deliver, expect_converged } from '../../.helpers/replica.js'

describe('tail replace Mask', () => {
  it('keeps the replacement paired with its Mask through restart', () => {
    const primary = new Projection<string>(100)
    const concurrent = new Projection<string>(101)
    const mutations: Array<Gossip<string>> = [
      primary.insert(['root'], 0),
      primary.insert(['branch-0', 'branch-1', 'branch-2', 'branch-3'], 0),
      concurrent.insert(['concurrent'], 0),
      primary.replace(['replacement'], 4, 4),
      primary.insert(['head-4'], 0),
      primary.insert(['head-5'], 0),
    ]
    const empty: Snapshot<string> = [[], []]
    const ordered = deliver(empty, mutations)
    const restarted = deliver(empty, mutations, 3)

    expect_converged(ordered, restarted)
    expect(new Set(ordered.values())).toEqual(
      new Set([
        'concurrent',
        'head-5',
        'head-4',
        'branch-0',
        'branch-1',
        'branch-2',
        'branch-3',
        'replacement',
      ])
    )
  })
})
