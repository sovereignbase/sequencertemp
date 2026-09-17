import { describe, expect, it } from 'vitest'
import { Sequence } from '../../../src/class.js'
import {
  create_seed,
  deliver,
  expect_converged,
} from '../../.helpers/replica.js'

describe('concurrent Mask and insert', () => {
  it('keeps the concurrent insertion outside the origin Mask', () => {
    const base = create_seed(['a', 'b', 'c'])
    const retained = base.snapshot()
    const deleting = new Sequence<string>(31, retained)
    const inserting = new Sequence<string>(32, retained)
    const deletion = deleting.remove(1, 1)
    const insertion = inserting.insert(['beside'], 2)

    const mask_first = deliver(retained, [deletion, insertion])
    const insert_first = deliver(retained, [insertion, deletion])
    expect_converged(mask_first, insert_first)
    expect(mask_first.values()).toEqual(['a', 'beside', 'c'])
  })
})
