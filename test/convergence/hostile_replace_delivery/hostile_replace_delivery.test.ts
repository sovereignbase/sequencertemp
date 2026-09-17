import { describe, expect, it } from 'vitest'
import { Sequence } from '../../../src/class.js'
import type { Gossip, Snapshot } from '../../../src/types/type.js'

const operations = [
  ['replace', 1837749800, 20512115, 1],
  ['replace', 1617521697, 1569299415, 1],
  ['insert', 1268534401, 1502952196, 4],
  ['insert', 743700871, 256912417, 1],
  ['insert', 1606676183, 1277281821, 1],
  ['replace', 171658493, 147095872, 3],
  ['remove', 664514791, 350362757, 1],
  ['replace', 522327745, 848656602, 3],
  ['remove', 692013875, 731636726, 2],
  ['remove', 1350957019, 300076836, 1],
  ['insert', 2083558510, 429549960, 4],
  ['replace', 163720766, 565574588, 4],
  ['insert', 735715695, 1304623410, 3],
  ['replace', 9806760, 2084350484, 1],
  ['replace', 556989605, 671512747, 3],
  ['replace', 1955270739, 1148533248, 1],
] as const

const deliveryKeys = [
  -587545375, -1451642704, 450361033, -1237044316, 746367878,
]

const project = (sequence: Sequence<string>): Array<string | undefined> =>
  Array.from({ length: sequence.projectionFrameCount }, (_, index) =>
    sequence.value(index)
  )

const deliver = (
  retained: Snapshot<string>,
  mutations: Array<Gossip<string>>
): Sequence<string> => {
  const receiver = new Sequence<string>(10_000, retained)
  for (const mutation of mutations) receiver.apply(mutation)
  return receiver
}

describe('hostile replace delivery', () => {
  it('converges in chronological, reverse, and mixed delivery order', () => {
    const base = new Sequence<string>(1)
    base.insert(['base-0', 'base-1', 'base-2', 'base-3'], 0)
    const retained = base.snapshot()
    const replicas = [
      new Sequence<string>(100, retained),
      new Sequence<string>(101, retained),
    ]
    const mutations: Array<Gossip<string>> = []

    operations.forEach(
      ([kind, replicaSelector, indexSelector, frameCount], operationIndex) => {
        const replicaIndex = replicaSelector % replicas.length
        const replica = replicas[replicaIndex]
        const length = replica.projectionFrameCount

        if (kind === 'remove') {
          if (length !== 0) {
            const start = indexSelector % length
            mutations.push(
              replica.remove(
                start,
                Math.min(length - 1, start + frameCount - 1)
              )
            )
          }
          return
        }

        const frames = Array.from(
          { length: frameCount },
          (_, frame) => `r${replicaIndex}-o${operationIndex}-f${frame}`
        )

        if (kind === 'replace') {
          if (length !== 0) {
            const start = indexSelector % length
            const count = Math.min(frameCount, length - start)
            mutations.push(
              replica.replace(frames.slice(0, count), start, start + count - 1)
            )
          }
          return
        }

        mutations.push(replica.insert(frames, indexSelector % (length + 1)))
      }
    )

    const chronological = deliver(retained, mutations)
    const reverse = deliver(retained, [...mutations].reverse())
    const mixed = deliver(
      retained,
      mutations
        .map((mutation, index) => ({
          mutation,
          key: deliveryKeys[index % deliveryKeys.length],
          index,
        }))
        .sort((left, right) => left.key - right.key || left.index - right.index)
        .map(({ mutation }) => mutation)
    )

    for (const receiver of [reverse, mixed]) {
      expect(receiver.projectionFrameCount).toBe(
        chronological.projectionFrameCount
      )
      expect(project(receiver)).toEqual(project(chronological))
    }
  })
})
