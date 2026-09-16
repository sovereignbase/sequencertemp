import { expect } from 'vitest'
import { Sequence } from '../../src/class.js'
import type { Delta, Snapshot } from '../../src/types/type.js'

export type Replica<T> = Sequence<T>

let actor = 10_000

export function create_seed<T>(values: Array<T>): Sequence<T> {
  const sequence = new Sequence<T>(actor++)
  sequence.insert(values, 0)
  return sequence
}

export function deliver<T>(
  base: Snapshot<T>,
  mutations: Array<Delta<T>>,
  restartAt?: number
): Sequence<T> {
  let sequence = new Sequence<T>(actor++, base)

  for (let index = 0; index < mutations.length; ++index) {
    sequence.apply(mutations[index])

    if (index + 1 === restartAt) {
      sequence = new Sequence<T>(actor++, sequence.snapshot())
      for (let replay = 0; replay <= index; ++replay)
        sequence.apply(mutations[replay])
    }
  }

  return sequence
}

export function expect_converged<T>(
  expected: Sequence<T>,
  actual: Sequence<T>
): void {
  expect(actual.values()).toEqual(expected.values())
}

export function shuffle_mutations<T>(
  mutations: Array<Delta<T>>,
  seed: number
): Array<Delta<T>> {
  const shuffled = [...mutations]

  for (let index = shuffled.length - 1; index > 0; --index) {
    seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0
    const other = seed % (index + 1)
    ;[shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]]
  }

  return shuffled
}
