import { describe, expect, it } from 'vitest'
import { Sequence } from '../../../src/class.js'
import type { Gossip } from '../../../src/types/type.js'
import {
  deriveSeed,
  Random,
  seedFromString,
  StripIndex,
} from '../../../benchmark/support.js'

type Runtime = {
  state: Sequence<number>
  peer: Sequence<number>
  strips: StripIndex
  random: Random
  nextId: number
}

const expectLivePeers = (runtime: Runtime): void => {
  expect(runtime.peer.visibleFrameCount).toBe(runtime.state.visibleFrameCount)
  expect(
    Array.from({ length: runtime.peer.visibleFrameCount }, (_, index) =>
      runtime.peer.find(index)
    )
  ).toEqual(
    Array.from({ length: runtime.state.visibleFrameCount }, (_, index) =>
      runtime.state.find(index)
    )
  )
}

const gossip = (
  runtime: Runtime,
  author: Sequence<number>,
  receiver: Sequence<number>,
  delta: Gossip<number>
): void => {
  const acknowledgements = receiver.apply(delta)?.[1]
  if (acknowledgements) author.apply(acknowledgements)
  expectLivePeers(runtime)
}

const replacement = (runtime: Runtime, length: number): Array<number> =>
  new Array<number>(length).fill(runtime.nextId++)

const insertAt = (runtime: Runtime, stripIndex: number): void => {
  const frameIndex = runtime.strips.frameOffsetAt(stripIndex)
  const id = runtime.nextId++
  const length = runtime.random.inclusive(1, 100)
  const values = new Array<number>(length).fill(id)
  gossip(
    runtime,
    runtime.state,
    runtime.peer,
    runtime.state.insert(values, frameIndex)
  )
  runtime.strips.insert(stripIndex, { id, length })
}

const removeAt = (runtime: Runtime, stripIndex: number): void => {
  const frameIndex = runtime.strips.frameOffsetAt(stripIndex)
  const strip = runtime.strips.at(stripIndex)
  gossip(
    runtime,
    runtime.state,
    runtime.peer,
    runtime.state.remove(frameIndex, frameIndex + strip.length)
  )
  runtime.strips.remove(stripIndex)
}

const primaryWorkload = (runtime: Runtime): void => {
  runtime.state.find(runtime.random.integer(runtime.strips.frameCount))

  let stripIndex = runtime.random.integer(runtime.strips.count)
  let frameIndex = runtime.strips.frameOffsetAt(stripIndex)
  let strip = runtime.strips.at(stripIndex)
  let values = replacement(runtime, strip.length)
  gossip(
    runtime,
    runtime.state,
    runtime.peer,
    runtime.state.replace(values, frameIndex, frameIndex + strip.length)
  )
  runtime.strips.replace(stripIndex, { id: values[0], length: values.length })

  removeAt(runtime, runtime.random.integer(runtime.strips.count))
  insertAt(runtime, runtime.random.integer(runtime.strips.count + 1))
}

const peerReplacement = (runtime: Runtime): void => {
  const stripIndex = runtime.random.integer(runtime.strips.count)
  const frameIndex = runtime.strips.frameOffsetAt(stripIndex)
  const strip = runtime.strips.at(stripIndex)
  const values = replacement(runtime, strip.length)
  gossip(
    runtime,
    runtime.peer,
    runtime.state,
    runtime.peer.replace(values, frameIndex, frameIndex + strip.length)
  )
  runtime.strips.replace(stripIndex, { id: values[0], length: values.length })
}

describe('live scale-down gossip', () => {
  it('keeps every visible index converged while shrinking', () => {
    const state = new Sequence<number>(3)
    const peer = new Sequence<number>(4)
    state.decreaseClock[0] = 3952081492
    peer.decreaseClock[0] = 1468193293

    const runtime: Runtime = {
      state,
      peer,
      strips: new StripIndex(),
      random: new Random(
        deriveSeed(seedFromString('sequencer-lifecycle-v1'), 'warmup')
      ),
      nextId: 1,
    }

    for (let step = 0; step < 8; ++step) {
      const tail = runtime.strips.count % 2 === 0
      insertAt(runtime, tail ? runtime.strips.count : 0)
      primaryWorkload(runtime)
      peerReplacement(runtime)
    }

    while (runtime.strips.count > 0) {
      primaryWorkload(runtime)
      const head = runtime.strips.count % 2 === 0
      removeAt(runtime, head ? 0 : runtime.strips.count - 1)
      if (runtime.strips.count > 0) peerReplacement(runtime)
    }
  })
})
