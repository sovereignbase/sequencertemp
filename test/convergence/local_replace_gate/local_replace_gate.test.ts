import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.js'

describe('local replace gate', () => {
  it('keeps the gate index on the left side of a same-strip replacement', () => {
    const sequence = new Projection<string>(100)

    sequence.insert(['a', 'b', 'c'], 0)
    sequence.replace(['x', 'y'], 0, 1)
    sequence.insert(['z'], 1)

    expect(sequence.values()).toEqual(['x', 'z', 'y', 'c'])
  })
})
