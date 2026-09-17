import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.js'
import type { Gossip, Snapshot } from '../../../src/types/type.js'
import { deliver, expect_converged } from '../../.helpers/replica.js'

describe('concurrent root restart', () => {
  it('preserves complete root subtrees through restart and redelivery', () => {
    const primary = new Projection<string>(100)
    const concurrent = new Projection<string>(101)
    const mutations: Array<Gossip<string>> = [
      primary.insert(['root-0', 'root-1'], 0),
      primary.insert(['first'], 0),
      concurrent.insert(['concurrent'], 0),
      primary.insert(['third'], 0),
      primary.insert(['fourth'], 0),
      primary.insert(['fifth'], 0),
    ]
    const empty: Snapshot<string> = [[], []]
    const ordered = deliver(empty, mutations)
    const restarted = deliver(empty, mutations, 3)

    expect_converged(ordered, restarted)
    expect(ordered.projectionFrameCount).toBe(7)
    expect(new Set(ordered.values())).toEqual(
      new Set([
        'concurrent',
        'fifth',
        'fourth',
        'third',
        'first',
        'root-0',
        'root-1',
      ])
    )
  })
})
