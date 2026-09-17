import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.js'
import type { Gossip, Snapshot } from '../../../src/types/type.js'

const project = <T>(sequence: Projection<T>): Array<T | undefined> =>
  Array.from({ length: sequence.projectionFrameCount }, (_, index) =>
    sequence.value(index)
  )

const expectConverged = <T>(
  expected: Projection<T>,
  replicas: Array<Projection<T>>
): void => {
  for (const replica of replicas) {
    expect(replica.projectionFrameCount).toBe(expected.projectionFrameCount)
    expect(project(replica)).toEqual(project(expected))
  }
}

const gossip = <T>(
  author: Projection<T>,
  receiver: Projection<T>,
  update: Gossip<T>
): void => {
  const acknowledgements = receiver.apply(update)?.[1]
  if (acknowledgements) {
    for (const acknowledgement of acknowledgements)
      expect(acknowledgement[0]).toBe(42)
    author.apply(acknowledgements)
  }
}

describe('same actor in multiple replicas', () => {
  it('keeps per-instance Clocks independent across concurrent tabs', () => {
    const seed = new Projection<string>(1)
    seed.insert(['a', 'b', 'c', 'd'], 0)
    const snapshot: Snapshot<string> = seed.snapshot()

    const left = new Projection<string>(42, snapshot)
    const right = new Projection<string>(42, snapshot)

    expect(left.increaseClock[0]).not.toBe(right.increaseClock[0])
    expect(left.decreaseClock[0]).not.toBe(right.decreaseClock[0])

    const leftInsert = left.insert(['left-0', 'left-1'], 1)
    const leftReplace = left.replace(['left-r0', 'left-r1'], 2, 3)
    const rightInsert = right.insert(['right-0', 'right-1'], 3)
    const rightRemove = right.remove(1, 2)

    gossip(left, right, leftInsert)
    gossip(left, right, leftReplace)
    gossip(right, left, rightRemove)
    gossip(right, left, rightInsert)

    expectConverged(left, [right])

    const leftTail = left.insert(['left-tail'], left.projectionFrameCount)
    const rightHead = right.replace(['right-head'], 0, 0)

    gossip(right, left, rightHead)
    gossip(left, right, leftTail)

    const replay = new Projection<string>(42, snapshot)
    for (const update of [
      rightHead,
      leftTail,
      rightRemove,
      rightInsert,
      leftReplace,
      leftInsert,
    ])
      replay.apply(update)

    expectConverged(left, [right, replay])
  })
})
