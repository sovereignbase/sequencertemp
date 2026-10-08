import { describe, expect, it } from 'vitest'
import { Projection } from '../../../../src/class.ts'
import type { Gossip } from '../../../../src/types/type.ts'

describe('projection gate stability', () => {
  it('keeps the projected position and resolves its gate after remote edits', () => {
    const author = new Projection<string>(1)
    author.insert(['a', 'b'], 0)
    author.insert(['c', 'd'], 2)
    author.insert(['e', 'f'], 4)
    const receiver = new Projection<string>(2, author.sequence())
    receiver.value(2)
    const position = receiver.projectedPosition
    expect(position).toBe(2)

    const apply = (gossip: Gossip<string>) => {
      receiver.apply(gossip)
      expect(receiver.projectedPosition).toBe(position)

      let index = 0
      for (
        let strip = receiver.structuralHead;
        strip;
        strip = strip.rightStep
      ) {
        const length = Math.max(0, strip.fragmentDiff ?? strip.insertionDiff)
        if (strip === receiver.gate) {
          expect(index).toBeLessThanOrEqual(position)
          expect(index + length).toBeGreaterThan(position)
          expect(
            strip.footage?.[(strip.fragmentStart ?? 0) + position - index]
          ).toBe(author.values()[position])
          return
        }
        index += length
      }
      throw new Error('gate is missing from Structural Order')
    }

    apply(author.insert(['head'], 0))
    apply(author.remove(0, 0))
    apply(author.insert(['at-gate'], position))
    apply(author.remove(position, position))
    apply(author.replace(['replacement'], position, position))
    apply(author.insert(['tail'], author.length()))
    apply(author.remove(author.length() - 1, author.length() - 1))

    expect(receiver.values()).toEqual(author.values())
  })

  it('keeps position zero when remote removal empties the projection', () => {
    const author = new Projection<string>(1)
    const receiver = new Projection<string>(2)
    receiver.apply(author.insert(['a'], 0))
    receiver.apply(author.remove())
    expect(receiver.projectedPosition).toBe(0)
    expect(receiver.head).toBeUndefined()
    expect(receiver.gate).toBeUndefined()
    expect(receiver.tail).toBeUndefined()

    receiver.apply(author.insert(['b'], 0))
    expect(receiver.projectedPosition).toBe(0)
    expect(receiver.gate).toBe(receiver.head)
    expect(receiver.tail).toBe(receiver.head)
    expect(receiver.values()).toEqual(['b'])
  })
})
