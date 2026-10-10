import { describe, expect, it } from 'vitest'
import { Projection } from '../../../../src/class.ts'
import type { Gossip } from '../../../../src/types/type.ts'

describe('safe local anchor selection', () => {
  it('uses the anchored insertion end when a boundary is already reserved', () => {
    const projection = new Projection<string>(1)
    projection.insert(['a', 'c'], 0)
    const inserted = projection.insert(['x'], 1)[0]

    const update = projection.insert(['y'], 2)

    expect(update[0].slice(0, 3)).toEqual([inserted[3], inserted[4], 1])
    expect(projection.value(2)).toBe('y')
    expect(projection.values()).toEqual(['a', 'x', 'y', 'c'])
  })

  it('uses a free mask boundary after the occupying insertion is removed', () => {
    const projection = new Projection<string>(1)
    projection.insert(['a'], 0)
    projection.insert(['b'], 1)
    projection.insert(['c'], 2)
    projection.insert(['x'], 2)
    projection.remove(1, 1)

    const update = projection.replace(['y'], 1, 1)

    const removal = update[0]
    expect(update.at(-1)!.slice(0, 3)).toEqual([
      removal[3], removal[4], -removal[5]!,
    ])
    expect(projection.value(1)).toBe('y')
    expect(projection.values()).toEqual(['a', 'y', 'c'])
  })

  it.each([[1_001, 1_002], [1_002, 1_001]])(
    'preserves a replacement boundary across authors (%i, %i)',
    (authorSession, editorSession) => {
      const author = new Projection<string>(1)
      const editor = new Projection<string>(2)
      author.increaseClock[0] = authorSession
      editor.increaseClock[0] = editorSession

      const deliver = (
        sender: Projection<string>,
        receiver: Projection<string>,
        update: Gossip<string>
      ) => {
        const result = receiver.apply(update)
        expect(result).toBeDefined()
        if (result![1]) sender.apply(result![1])
      }

      deliver(author, editor, author.insert(['a'], 0))
      deliver(author, editor, author.insert(['b'], 1))
      deliver(author, editor, author.insert(['c'], 2))
      deliver(author, editor, author.insert(['x'], 2))
      deliver(author, editor, author.remove(1, 1))

      const update = editor.replace(['y'], 1, 1)
      expect(update.at(-1)!.slice(0, 3)).toEqual([
        update[0][3], update[0][4], -update[0][5]!,
      ])
      expect(editor.value(1)).toBe('y')
      deliver(editor, author, update)

      expect(author.value(1)).toBe('y')
      expect(author.values()).toEqual(['a', 'y', 'c'])
      expect(editor.values()).toEqual(['a', 'y', 'c'])
    }
  )
})
