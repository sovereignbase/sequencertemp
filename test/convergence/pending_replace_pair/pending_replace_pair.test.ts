import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.js'

describe('pending replace pair', () => {
  it('preserves Mask-before-replacement order after its parent arrives', () => {
    const author = new Projection<string>(100)
    const parent = author.insert(['parent'], 0)
    const replacement = author.replace(['replacement'], 0, 0)

    const ordered = new Projection<string>(200)
    ordered.apply(parent)
    ordered.apply(replacement)

    const pending = new Projection<string>(201)
    pending.apply(replacement)
    pending.apply(parent)

    expect(pending.projectionFrameCount).toBe(ordered.projectionFrameCount)
    expect(pending.value(0)).toBe(ordered.value(0))
    expect(pending.value(0)).toBe('replacement')
  })
})
