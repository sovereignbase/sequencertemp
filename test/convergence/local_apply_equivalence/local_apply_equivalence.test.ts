import { describe, expect, it } from 'vitest'
import { Sequence } from '../../../src/class.js'
import type { Delta } from '../../../src/types/type.js'

const gossip = <T>(
  author: Sequence<T>,
  receiver: Sequence<T>,
  delta: Delta<T>
): void => {
  const acknowledgements = receiver.apply(delta)?.[1]
  if (acknowledgements) author.apply(acknowledgements)
}

describe('local and applied fragment coordinates', () => {
  it('places a boundary insertion identically at its author and receiver', () => {
    const author = new Sequence<number>(100)
    const receiver = new Sequence<number>(101)

    gossip(author, receiver, author.insert([1, 1], 0))
    gossip(author, receiver, author.replace([2, 2], 0, 2))
    gossip(author, receiver, author.insert([3, 3], 0))

    expect(author.values()).toEqual([3, 3, 2, 2])
    expect(receiver.values()).toEqual(author.values())

    gossip(author, receiver, author.insert([7, 7], 2))

    expect(author.values()).toEqual([3, 3, 7, 7, 2, 2])
    expect(receiver.values()).toEqual(author.values())
  })
})
