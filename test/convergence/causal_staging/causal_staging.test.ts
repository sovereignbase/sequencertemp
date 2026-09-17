import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.js'
import { expect_converged } from '../../.helpers/replica.js'

describe('causal staging', () => {
  it('retains a child and resolves it when its missing parent arrives', () => {
    const source = new Projection<string>(21)
    const parent = source.insert(['parent'], 0)
    const child = source.insert(['child'], 1)

    const target = new Projection<string>(22)
    expect(target.apply(child)).toBeDefined()
    expect(target.values()).toEqual([])
    expect(target.apply(parent)).toBeDefined()
    expect_converged(source, target)
  })
})
