import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.js'
import type { Snapshot } from '../../../src/types/type.js'
import { deliver, expect_converged } from '../../.helpers/replica.js'

describe('historical boundary view', () => {
  it('orders same-actor insertions by the view in which they were authored', () => {
    const source = new Projection<string>(100)
    const mutations = [
      source.insert(['root'], 0),
      source.insert(['first'], 0),
      source.insert(['second'], 0),
      source.insert(['middle'], 1),
      source.insert(['fourth'], 0),
      source.insert(['fifth'], 0),
    ]
    const empty: Snapshot<string> = [[], []]
    const ordered = deliver(empty, mutations)
    const hostile = deliver(empty, [
      mutations[0],
      mutations[1],
      mutations[3],
      mutations[4],
      mutations[2],
      mutations[5],
    ])

    expect_converged(ordered, hostile)
    expect(ordered.values()).toEqual([
      'fifth',
      'fourth',
      'second',
      'middle',
      'first',
      'root',
    ])
  })
})
