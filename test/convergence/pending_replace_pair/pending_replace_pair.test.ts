import { describe, expect, it } from 'vitest'
import { Sequence } from '../../../src/class.js'

describe('pending replace pair', () => {
  it('preserves Mask-before-replacement order after its parent arrives', () => {
    const author = new Sequence<string>(100)
    const parent = author.insert(['parent'], 0)
    const replacement = author.replace(['replacement'], 0, 1)

    const ordered = new Sequence<string>(200)
    ordered.apply(parent)
    ordered.apply(replacement)

    const pending = new Sequence<string>(201)
    pending.apply(replacement)
    pending.apply(parent)

    expect(pending.visibleFrameCount).toBe(ordered.visibleFrameCount)
    expect(pending.find(0)).toBe(ordered.find(0))
    expect(pending.find(0)).toBe('replacement')
  })
})
