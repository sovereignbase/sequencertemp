import { describe, expect, it } from 'vitest'
import { Sequence } from '../../../src/class.js'
import type { Gossip } from '../../../src/types/type.js'
import {
  deriveSeed,
  Random,
  seedFromString,
  StripIndex,
} from '../../../benchmark/support.js'

const project = (sequence: Sequence<number>): Array<number | undefined> =>
  Array.from({ length: sequence.projectionFrameCount }, (_, index) =>
    sequence.value(index)
  )

describe('benchmark local/remote replacement equivalence', () => {
  it('converges after every immediately delivered Gossip update', () => {
    const state = new Sequence<number>(1)
    const peer = new Sequence<number>(2)
    state.increaseClock[0] = 1_001
    state.decreaseClock[0] = 2_001
    peer.increaseClock[0] = 1_002
    peer.decreaseClock[0] = 2_002

    const strips = new StripIndex()
    const random = new Random(
      deriveSeed(
        deriveSeed(seedFromString('sequencer-lifecycle-v1'), 'run:0'),
        'shared-replica-workload'
      )
    )
    let nextStripId = 1

    const gossip = (
      author: Sequence<number>,
      receiver: Sequence<number>,
      update: Gossip<number>
    ) => {
      const acknowledgements = receiver.apply(update)?.[1]
      if (acknowledgements) author.apply(acknowledgements)
      expect(receiver.projectionFrameCount).toBe(author.projectionFrameCount)
    }

    const createStrip = (length?: number) => {
      const id = nextStripId++
      const frameCount = length ?? random.inclusive(1, 100)
      return { id, length: frameCount, values: new Array(frameCount).fill(id) }
    }

    for (let step = 0; step < 100; ++step) {
      const insertionIndex = strips.count % 2 === 0 ? strips.count : 0
      const insertionFrame = strips.frameOffsetAt(insertionIndex)
      const inserted = createStrip()
      gossip(state, peer, state.insert(inserted.values, insertionFrame))
      strips.insert(insertionIndex, inserted)

      void state.value(random.integer(strips.frameCount))

      const replacementIndex = random.integer(strips.count)
      const replacementFrame = strips.frameOffsetAt(replacementIndex)
      const replaced = strips.at(replacementIndex)
      const replacement = createStrip(replaced.length)
      gossip(
        state,
        peer,
        state.replace(
          replacement.values,
          replacementFrame,
          replacementFrame + replaced.length - 1
        )
      )
      strips.replace(replacementIndex, replacement)

      const removalIndex = random.integer(strips.count)
      const removalFrame = strips.frameOffsetAt(removalIndex)
      const removed = strips.at(removalIndex)
      gossip(
        state,
        peer,
        state.remove(removalFrame, removalFrame + removed.length - 1)
      )
      strips.remove(removalIndex)

      const randomInsertionIndex = random.integer(strips.count + 1)
      const randomInsertionFrame = strips.frameOffsetAt(randomInsertionIndex)
      const randomInsertion = createStrip()
      gossip(
        state,
        peer,
        state.insert(randomInsertion.values, randomInsertionFrame)
      )
      strips.insert(randomInsertionIndex, randomInsertion)

      const ingestIndex = random.integer(strips.count)
      const ingestFrame = strips.frameOffsetAt(ingestIndex)
      const ingested = createStrip(strips.at(ingestIndex).length)
      gossip(
        peer,
        state,
        peer.replace(
          ingested.values,
          ingestFrame,
          ingestFrame + ingested.length - 1
        )
      )
      strips.replace(ingestIndex, ingested)

      if (step === 0 || step === 9 || step === 99)
        expect(project(peer)).toEqual(project(state))
    }
  })
})
