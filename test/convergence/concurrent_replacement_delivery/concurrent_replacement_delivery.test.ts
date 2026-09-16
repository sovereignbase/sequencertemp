import { describe, expect, it } from 'vitest'
import { Sequence } from '../../../src/class.js'
import type { Gossip, Snapshot } from '../../../src/types/type.js'

const operations = [
  ['insert', 180133792, 1109629188, 4],
  ['replace', 1199022686, 394473361, 1],
  ['insert', 581967531, 387536348, 1],
  ['replace', 1483458282, 12320982, 1],
  ['replace', 1099093393, 443596640, 1],
  ['replace', 1025719290, 120165420, 4],
  ['remove', 1165076140, 389590309, 1],
  ['replace', 381757984, 1887995565, 1],
] as const

const deliveryKeys = [
  -1217396083, -7, -19, 20, -2147483641, -779887926, 2147483629, -28,
  -2147483620, -26,
]

const project = (sequence: Sequence<string>): Array<string | undefined> =>
  Array.from({ length: sequence.visibleFrameCount }, (_, index) =>
    sequence.find(index)
  )

const deliver = (
  retained: Snapshot<string>,
  gossip: Array<Gossip<string>>
): Sequence<string> => {
  const receiver = new Sequence<string>(10_000, retained)
  for (const update of gossip) receiver.apply(update)
  return receiver
}

describe('concurrent replacement delivery', () => {
  it('converges in chronological and deterministic mixed order', () => {
    const base = new Sequence<string>(1)
    base.insert(
      Array.from({ length: 5 }, (_, index) => `base-${index}`),
      0
    )
    const retained = base.snapshot()
    const replicas = [0, 1, 2].map(
      (index) => new Sequence<string>(100 + index, retained)
    )
    const gossip: Array<Gossip<string>> = []

    operations.forEach(
      ([kind, replicaSelector, indexSelector, frameCount], operationIndex) => {
        const replicaIndex = replicaSelector % replicas.length
        const replica = replicas[replicaIndex]
        const length = replica.visibleFrameCount

        if (kind === 'remove') {
          if (length !== 0) {
            const start = indexSelector % length
            gossip.push(
              replica.remove(start, Math.min(length, start + frameCount))
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
              replica.replace(frames.slice(0, count), start, start + count)
            )
          }
          return
        }

        gossip.push(replica.insert(frames, indexSelector % (length + 1)))
      }
    )

    const chronological = deliver(retained, gossip)
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

    expect(mixed.visibleFrameCount).toBe(chronological.visibleFrameCount)
    expect(project(mixed)).toEqual(project(chronological))
  })
})
