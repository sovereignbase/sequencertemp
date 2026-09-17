import { describe, it } from 'vitest'
import { Sequence } from '../../../src/class.js'
import type { Gossip, Snapshot } from '../../../src/types/type.js'
import {
  deliver,
  expect_converged,
  shuffle_mutations,
} from '../../.helpers/replica.js'

describe('restart and redelivery', () => {
  it('converges through hostile delivery, create, and stale redelivery', () => {
    const retained: Snapshot<string> = [[], []]
    const mutations: Array<Gossip<string>> = [41, 42, 43, 44, 45].map(
      (actor) => new Sequence<string>(actor).insert([`actor-${actor}`], 0)
    )

    const ordered = deliver(retained, mutations)
    const restarted = deliver(
      retained,
      shuffle_mutations(mutations, 0xc0ffee),
      Math.ceil(mutations.length / 2)
    )
    for (const mutation of mutations) restarted.apply(mutation)
    const compacted_on_create = new Sequence<string>(43, restarted.snapshot())

    expect_converged(ordered, restarted)
    expect_converged(ordered, compacted_on_create)
  })
})
