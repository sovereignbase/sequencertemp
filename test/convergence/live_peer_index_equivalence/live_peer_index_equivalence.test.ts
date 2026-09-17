import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.js'
import type { Gossip } from '../../../src/types/type.js'

const expect_same_projection = <T>(
  left: Projection<T>,
  right: Projection<T>
): void => {
  expect(right.projectionFrameCount).toBe(left.projectionFrameCount)

  for (let index = 0; index < left.projectionFrameCount; ++index)
    expect(right.value(index)).toBe(left.value(index))
}

const gossip = <T>(
  author: Projection<T>,
  receiver: Projection<T>,
  delta: Gossip<T>
): void => {
  const acknowledgements = receiver.apply(delta)?.[1]
  if (acknowledgements) author.apply(acknowledgements)
  expect_same_projection(author, receiver)
}

describe('live peer projection-position equivalence through signed jumps', () => {
  it('returns the same Footage from every projection position', () => {
    const state = new Projection<number>(1)
    const peer = new Projection<number>(2)

    gossip(state, peer, state.insert([1, 1], 0))
    gossip(state, peer, state.replace([2, 2], 0, 1))
    gossip(state, peer, state.remove(0, 1))
    gossip(state, peer, state.insert([3, 3], 0))
    gossip(peer, state, peer.replace([4, 4], 0, 1))

    gossip(state, peer, state.insert([5, 5], 0))
    gossip(state, peer, state.replace([6, 6], 0, 1))
    gossip(state, peer, state.remove(0, 1))
    gossip(state, peer, state.insert([7, 7], 2))
    gossip(peer, state, peer.replace([8, 8], 0, 1))

    gossip(state, peer, state.insert([9, 9], 4))
    gossip(state, peer, state.replace([10, 10], 2, 3))
    gossip(state, peer, state.remove(4, 5))
    gossip(state, peer, state.insert([11, 11], 2))
    gossip(peer, state, peer.replace([12, 12], 2, 3))

    gossip(state, peer, state.insert([13, 13], 0))
    gossip(state, peer, state.replace([14, 14], 2, 3))

    expect(state.projectionFrameCount).toBe(8)
    expect(
      Array.from({ length: state.projectionFrameCount }, (_, index) =>
        state.value(index)
      )
    ).toEqual([13, 13, 14, 14, 12, 12, 10, 10])
  })
})
