import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.js'
import type { Gossip, Sequence } from '../../../src/types/type.js'

const operations = [
  ['replace', 714732407, 1247215733, 1],
  ['insert', 1920487907, 35035786, 2],
  ['replace', 2059015479, 6, 1],
  ['remove', 869144873, 1922780283, 2],
  ['insert', 1876648066, 1, 4],
  ['replace', 1978790635, 1506149196, 2],
  ['remove', 20, 3, 4],
  ['insert', 383284506, 1, 4],
  ['insert', 281936605, 40403690, 3],
] as const

const deliveryKeys = [
  702303704, -1097475808, -180650997, 1330791140, -1039610715, 2111140307,
  1841741144,
]

const sessionOrders = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
] as const

const project = (sequence: Projection<string>): Array<string | undefined> =>
  Array.from({ length: sequence.projectionFrameCount }, (_, index) =>
    sequence.value(index)
  )

const deliver = (
  retained: Sequence<string>,
  mutations: Array<Gossip<string>>
): Projection<string> => {
  const receiver = new Projection<string>(10_000, retained)
  for (const mutation of mutations) receiver.apply(mutation)
  return receiver
}

describe('hostile three-peer delivery', () => {
  it('converges from an empty sequence in chronological and mixed order', () => {
    const retained = new Projection<string>(1).sequence()
    for (const increaseOrder of sessionOrders)
      for (const decreaseOrder of sessionOrders) {
        const replicas = [
          new Projection<string>(100, retained),
          new Projection<string>(101, retained),
          new Projection<string>(102, retained),
        ]
        replicas.forEach((replica, index) => {
          replica.increaseClock[0] = 1_000 + increaseOrder[index]
          replica.decreaseClock[0] = 2_000 + decreaseOrder[index]
        })
        const mutations: Array<Gossip<string>> = []

        operations.forEach(
          (
            [kind, replicaSelector, indexSelector, frameCount],
            operationIndex
          ) => {
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
                  replica.replace(
                    frames.slice(0, count),
                    start,
                    start + count - 1
                  )
                )
              }
              return
            }

            mutations.push(replica.insert(frames, indexSelector % (length + 1)))
          }
        )

        const chronological = deliver(retained, mutations)
        const mixed = deliver(
          retained,
          mutations
            .map((mutation, index) => ({
              mutation,
              key: deliveryKeys[index % deliveryKeys.length],
              index,
            }))
            .sort(
              (left, right) => left.key - right.key || left.index - right.index
            )
            .map(({ mutation }) => mutation)
        )

        expect(mixed.projectionFrameCount).toBe(
          chronological.projectionFrameCount
        )
        expect(
          project(mixed),
          `increase ${increaseOrder.join(',')} decrease ${decreaseOrder.join(',')}`
        ).toEqual(project(chronological))
      }
  })
})
