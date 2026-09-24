import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.js'
import type { Sequence } from '../../../src/types/type.js'
import { deliver } from '../../.helpers/replica.js'

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
    const empty: Sequence<string> = [[], []]
    const ordered = deliver(empty, mutations)
    const hostile = deliver(empty, [
      mutations[0],
      mutations[1],
      mutations[3],
      mutations[4],
      mutations[2],
      mutations[5],
    ])

    const expected = [
      'middle',
      'fifth',
      'fourth',
      'second',
      'first',
      'root',
    ]

    expect(ordered.values()).toEqual(expected)
    expect(hostile.values()).toEqual(expected)
  })
})
