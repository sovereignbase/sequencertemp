import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.js'
import type { Gossip, Sequence } from '../../../src/types/type.js'

const operations = [
  ['remove', 2046280841, 395543388, 3],
  ['insert', 1269260299, 509571653, 2],
  ['insert', 682928331, 1883896801, 2],
  ['insert', 308408876, 307794834, 2],
  ['remove', 1313517349, 1028241202, 1],
  ['replace', 425806567, 1316093502, 2],
  ['remove', 1784413307, 1183766439, 2],
  ['insert', 899878280, 481760832, 3],
  ['replace', 1934409216, 150408220, 2],
  ['insert', 27945260, 108302903, 2],
  ['remove', 503092380, 298607732, 4],
  ['remove', 1631815643, 2072606514, 1],
  ['insert', 452223204, 249485537, 1],
  ['insert', 199131081, 1219490238, 1],
] as const

const deliveryKeys = [
  424738099, 173723364, 1960494304, 614813501, 700557849, -1769193726,
  -1179057743, 208131268, 805600223, 1204235890,
]

const project = (sequence: Projection<string>): Array<string | undefined> =>
  Array.from({ length: sequence.projectionFrameCount }, (_, index) =>
    sequence.value(index)
  )

const deliver = (
  retained: Sequence<string>,
  gossip: Array<Gossip<string>>
): Projection<string> => {
  const receiver = new Projection<string>(10_000, retained)
  for (const update of gossip) receiver.apply(update)
  return receiver
}

describe('overlapping mask content ownership', () => {
  it('converges in chronological, reverse, and mixed delivery order', () => {
    const base = new Projection<string>(1)
    base.insert(
      Array.from({ length: 6 }, (_, index) => `base-${index}`),
      0
    )
    const retained = base.sequence()
    const replicas = [0, 1, 2].map(
      (index) => new Projection<string>(100 + index, retained)
    )
    const sessions = [
      [1310894871851451, 8540722160613772],
      [3273387611390330, 4888754746934803],
      [8750552661131626, 8381653247400557],
    ]
    replicas.forEach((replica, index) => {
      replica.increaseClock[0] = sessions[index][0]
      replica.decreaseClock[0] = sessions[index][1]
    })
    const gossip: Array<Gossip<string>> = []

    operations.forEach(
      ([kind, replicaSelector, indexSelector, frameCount], operationIndex) => {
        const replicaIndex = replicaSelector % replicas.length
        const replica = replicas[replicaIndex]
        const length = replica.projectionFrameCount

        if (kind === 'remove') {
          if (length !== 0) {
            const start = indexSelector % length
            gossip.push(
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
            gossip.push(
              replica.replace(frames.slice(0, count), start, start + count - 1)
            )
          }
          return
        }

        gossip.push(replica.insert(frames, indexSelector % (length + 1)))
      }
    )

    const chronological = deliver(retained, gossip)
    const reverse = deliver(retained, [...gossip].reverse())
    const mixed = deliver(
      retained,
      gossip
        .map((update, index) => ({
          update,
          key: deliveryKeys[index % deliveryKeys.length],
          index,
        }))
        .sort((left, right) => left.key - right.key || left.index - right.index)
        .map(({ update }) => update)
    )

    for (const receiver of [reverse, mixed]) {
      expect(receiver.projectionFrameCount).toBe(
        chronological.projectionFrameCount
      )
      expect(project(receiver)).toEqual(project(chronological))
    }
  })
})
