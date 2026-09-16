import { describe, expect, it } from 'vitest'
import { Sequence } from '../../../src/class.js'
import type { Delta, Snapshot } from '../../../src/types/type.js'
import { deliver, expect_converged } from '../../.helpers/replica.js'

const empty: Snapshot<string> = [[], []]

describe('shrunk stress regressions', () => {
  it('preserves one actor historical view at a shared boundary', () => {
    const source = new Sequence<string>(100)
    const mutations = [
      source.insert(['root'], 0),
      source.insert(['first'], 0),
      source.insert(['second'], 0),
      source.insert(['middle'], 1),
      source.insert(['fourth'], 0),
      source.insert(['fifth'], 0),
    ]

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

  it('preserves concurrent root subtrees through restart and redelivery', () => {
    const primary = new Sequence<string>(100)
    const concurrent = new Sequence<string>(101)
    const mutations: Array<Delta<string>> = [
      primary.insert(['root-0', 'root-1'], 0),
      primary.insert(['first'], 0),
      concurrent.insert(['concurrent'], 0),
      primary.insert(['third'], 0),
      primary.insert(['fourth'], 0),
      primary.insert(['fifth'], 0),
    ]

    const ordered = deliver(empty, mutations)
    const restarted = deliver(empty, mutations, 3)

    expect_converged(ordered, restarted)
    expect(ordered.values()).toEqual([
      'concurrent',
      'fifth',
      'fourth',
      'third',
      'first',
      'root-0',
      'root-1',
    ])
  })

  it('keeps a concurrent root outside a causal replace Mask after restart', () => {
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

  it('keeps a tail replacement paired with its Mask through restart', () => {
    const primary = new Sequence<string>(100)
    const concurrent = new Sequence<string>(101)
    const mutations: Array<Delta<string>> = [
      primary.insert(['root'], 0),
      primary.insert(['branch-0', 'branch-1', 'branch-2', 'branch-3'], 0),
      concurrent.insert(['concurrent'], 0),
      primary.replace(['replacement'], 4, 5),
      primary.insert(['head-4'], 0),
      primary.insert(['head-5'], 0),
    ]

    const ordered = deliver(empty, mutations)
    const restarted = deliver(empty, mutations, 3)
    const recreated = new Sequence<string>(102, restarted.snapshot())

    expect_converged(ordered, restarted)
    expect_converged(ordered, recreated)
    expect(ordered.values()).toEqual([
      'concurrent',
      'head-5',
      'head-4',
      'branch-0',
      'branch-1',
      'branch-2',
      'branch-3',
      'replacement',
    ])
  })
})
