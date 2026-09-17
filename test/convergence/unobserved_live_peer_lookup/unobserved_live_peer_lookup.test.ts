import { describe, expect, it } from 'vitest'
import { Sequence } from '../../../src/class.js'
import type { Gossip } from '../../../src/types/type.js'

const gossip = <T>(
  author: Sequence<T>,
  receiver: Sequence<T>,
  delta: Gossip<T>
): void => {
  const acknowledgements = receiver.apply(delta)?.[1]
  if (acknowledgements) author.apply(acknowledgements)
}

describe('unobserved live peer lookup', () => {
  it('resolves every Frame after several edits without intermediate reads', () => {
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
    gossip(state, peer, state.remove(4, 6))
    gossip(state, peer, state.insert([15, 15], 0))
    const finalReplacement = peer.replace([16, 16], 2, 4)
    gossip(peer, state, finalReplacement)

    expect(peer.visibleFrameCount).toBe(state.visibleFrameCount)
    expect(state.visibleFrameCount).toBe(8)

    const stateValues = Array.from(
      { length: state.visibleFrameCount },
      (_, index) => state.find(index)
    )
    const peerValues = Array.from(
      { length: peer.visibleFrameCount },
      (_, index) => peer.find(index)
    )

    expect(peerValues).toEqual(stateValues)
    expect(stateValues).toEqual([15, 15, 16, 16, 14, 14, 10, 10])
  })
})
