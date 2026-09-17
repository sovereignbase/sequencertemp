import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.js'
import type { Gossip } from '../../../src/types/type.js'

const gossip = <T>(
  author: Projection<T>,
  receiver: Projection<T>,
  delta: Gossip<T>
): void => {
  const acknowledgements = receiver.apply(delta)?.[1]
  if (acknowledgements) author.apply(acknowledgements)
}

describe('local and applied fragment coordinates', () => {
  it('places a boundary insertion identically at its author and receiver', () => {
    const author = new Projection<number>(100)
    const receiver = new Projection<number>(101)

    gossip(author, receiver, author.insert([1, 1], 0))
    gossip(author, receiver, author.replace([2, 2], 0, 1))
    gossip(author, receiver, author.insert([3, 3], 0))

    expect(author.values()).toEqual([3, 3, 2, 2])
    expect(receiver.values()).toEqual(author.values())

    gossip(author, receiver, author.insert([7, 7], 2))

    expect(author.values()).toEqual([3, 3, 7, 7, 2, 2])
    expect(receiver.values()).toEqual(author.values())
  })
})
