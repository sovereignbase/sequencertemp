import { describe, expect, it } from 'vitest'
import { Sequence } from '../../../src/class.js'
import type { Delta } from '../../../src/types/type.js'

const expect_same_projection = <T>(
  left: Sequence<T>,
  right: Sequence<T>
): void => {
  expect(right.visibleFrameCount).toBe(left.visibleFrameCount)

  for (let index = 0; index < left.visibleFrameCount; ++index)
    expect(right.find(index)).toBe(left.find(index))
}

const gossip = <T>(
  author: Sequence<T>,
  receiver: Sequence<T>,
  delta: Delta<T>
): void => {
  const acknowledgements = receiver.apply(delta)?.[1]
  if (acknowledgements) author.apply(acknowledgements)
  expect_same_projection(author, receiver)
}

describe('live peer index equivalence through signed jumps', () => {
  it('returns the same Footage from every visible index', () => {
    const state = new Sequence<number>(1)
    const peer = new Sequence<number>(2)

    gossip(state, peer, state.insert([1, 1], 0))
    gossip(state, peer, state.replace([2, 2], 0, 2))
    gossip(state, peer, state.remove(0, 2))
    gossip(state, peer, state.insert([3, 3], 0))
    gossip(peer, state, peer.replace([4, 4], 0, 2))

    gossip(state, peer, state.insert([5, 5], 0))
    gossip(state, peer, state.replace([6, 6], 0, 2))
    gossip(state, peer, state.remove(0, 2))
    gossip(state, peer, state.insert([7, 7], 2))
    gossip(peer, state, peer.replace([8, 8], 0, 2))

    gossip(state, peer, state.insert([9, 9], 4))
    gossip(state, peer, state.replace([10, 10], 2, 4))
    gossip(state, peer, state.remove(4, 6))
    gossip(state, peer, state.insert([11, 11], 2))
    gossip(peer, state, peer.replace([12, 12], 2, 4))

    gossip(state, peer, state.insert([13, 13], 0))
    gossip(state, peer, state.replace([14, 14], 2, 4))

    expect(state.visibleFrameCount).toBe(8)
    expect(
      Array.from(
        { length: state.visibleFrameCount },
        (_, index) => state.find(index)
      )
    ).toEqual([13, 13, 14, 14, 12, 12, 10, 10])
  })
})
