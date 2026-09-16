import { describe, expect, it } from 'vitest'
import { Sequence } from '../../../src/class.js'
import type { Delta, Snapshot } from '../../../src/types/type.js'
import { deliver, expect_converged } from '../../.helpers/replica.js'

describe('concurrent root ordering', () => {
  it('is deterministic independently of delivery order', () => {
    const mutations: Array<Delta<string>> = []
    for (const [actor, value] of [
      [11, 'first'],
      [12, 'second'],
      [13, 'third'],
      [14, 'fourth'],
    ] as const) {
      const state = new Sequence<string>(actor)
      mutations.push(state.insert([value], 0))
    }

    const empty: Snapshot<string> = [[], []]
    const forward = deliver<string>(empty, mutations)
    const reverse = deliver<string>(empty, [...mutations].reverse())
    expect_converged(forward, reverse)
    expect(forward.values()).toEqual(['fourth', 'third', 'second', 'first'])
    expect(new Set(forward.values())).toEqual(
      new Set(['first', 'second', 'third', 'fourth'])
    )
  })
})
