import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.js'

describe('snapshot jump preoptimization', () => {
  it('creates valid square-root-spaced jumps during reconstruction', () => {
    const source = new Projection<number>(1)
    for (let value = 0; value < 16; ++value)
      source.insert([value], source.projectionFrameCount)

    const snapshot = source.sequence()
    const recreated = new Projection<number>(2, snapshot)
    const spacing = Math.round(Math.sqrt(snapshot[1].length))

    let jump = recreated.head
    let jumpCount = 0
    while (jump?.rightJump) {
      expect(jump.rightJumpStripCount).toBe(spacing)
      expect(jump.rightJumpFrameCount).toBe(spacing)
      expect(jump.rightJump.leftJump).toBe(jump)
      jump = jump.rightJump
      ++jumpCount
    }

    expect(jumpCount).toBe(3)
    expect(recreated.values()).toEqual(source.values())
  })
})
