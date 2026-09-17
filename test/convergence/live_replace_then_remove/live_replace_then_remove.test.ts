import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.js'
import type { Gossip } from '../../../src/types/type.js'

const frames = (value: number, length: number): Array<number> =>
  new Array<number>(length).fill(value)

const expectLivePeers = (
  left: Projection<number>,
  right: Projection<number>
): void => {
  expect(right.projectionFrameCount).toBe(left.projectionFrameCount)
  expect(
    Array.from({ length: right.projectionFrameCount }, (_, index) =>
      right.value(index)
    )
  ).toEqual(
    Array.from({ length: left.projectionFrameCount }, (_, index) =>
      left.value(index)
    )
  )
}

const gossip = (
  author: Projection<number>,
  receiver: Projection<number>,
  delta: Gossip<number>
): void => {
  const acknowledgements = receiver.apply(delta)?.[1]
  if (acknowledgements) author.apply(acknowledgements)
  expectLivePeers(author, receiver)
}

describe('live replace then remove', () => {
  it('keeps the local and remotely applied structures equivalent', () => {
    const primary = new Projection<number>(3)
    const peer = new Projection<number>(4)
    primary.decreaseClock[0] = 531265640
    peer.decreaseClock[0] = 420094554

    gossip(primary, peer, primary.insert(frames(1, 86), 0))
    gossip(primary, peer, primary.replace(frames(2, 86), 0, 85))
    gossip(primary, peer, primary.remove(0, 85))
    gossip(primary, peer, primary.insert(frames(3, 90), 0))
    gossip(peer, primary, peer.replace(frames(4, 90), 0, 89))

    gossip(primary, peer, primary.insert(frames(5, 77), 0))
    gossip(primary, peer, primary.replace(frames(6, 90), 77, 166))
    gossip(primary, peer, primary.remove(0, 76))
    gossip(primary, peer, primary.insert(frames(7, 28), 0))
    gossip(peer, primary, peer.replace(frames(8, 90), 28, 117))

    gossip(primary, peer, primary.insert(frames(9, 3), 118))
    gossip(primary, peer, primary.replace(frames(10, 28), 0, 27))
    gossip(primary, peer, primary.remove(28, 117))
    gossip(primary, peer, primary.insert(frames(11, 88), 31))
    gossip(peer, primary, peer.replace(frames(12, 28), 0, 27))

    gossip(primary, peer, primary.insert(frames(13, 42), 0))
    gossip(primary, peer, primary.replace(frames(14, 3), 70, 72))
    gossip(primary, peer, primary.remove(73, 160))
    gossip(primary, peer, primary.insert(frames(15, 96), 0))
    gossip(peer, primary, peer.replace(frames(16, 96), 0, 95))

    gossip(primary, peer, primary.insert(frames(17, 66), 169))
    gossip(primary, peer, primary.replace(frames(18, 96), 0, 95))
    gossip(primary, peer, primary.remove(138, 165))
  })
})
