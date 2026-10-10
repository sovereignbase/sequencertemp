import { describe, expect, it } from 'vitest'
import { Projection } from '../../../../src/class.ts'

describe('projection equivalence before and after hydration', () => {
  it.each([false, true])(
    'preserves insertion order with compaction %s',
    (compact) => {
      const base = new Projection<string>(1)
      base.increaseClock[0] = 10
      const root = base.insert(['tail'], 0)

      const original = new Projection<string>(2)
      original.increaseClock[0] = 30
      original.apply(root)
      const branch = original.insert(['old'], 0)

      const local = new Projection<string>(3)
      local.increaseClock[0] = 50
      local.decreaseClock[0] = 60
      const remote = new Projection<string>(4)
      remote.increaseClock[0] = 20

      for (const projection of [local, remote]) {
        projection.apply(root)
        projection.apply(branch)
      }

      // The active remote has not received the removal, so its mask cannot compact.
      local.apply([[remote.actorID]])
      const removal = local.remove(0, 0)
      const insertion = local.insert(['X'], 0)
      const concurrent = remote.insert(['Y'], 1)
      local.apply(concurrent)

      // The local edit uses the removed region's free endpoint.
      expect(insertion[0].slice(0, 3)).toEqual([
        removal[0][3],
        removal[0][4],
        1,
      ])
      const before = local.values()
      expect(before).toEqual(['Y', 'X', 'tail'])

      if (compact) {
        // Both active replicas have now received the complete removal Session.
        const result = remote.apply(removal)!
        local.apply(result[1])
      }

      const snapshot = local.sequence()
      expect(snapshot[1].some((entry) => entry[3] === 60 && entry[5] < 0)).toBe(
        !compact
      )
      expect(local.values()).toEqual(before)
      const hydrated = new Projection<string>(5, snapshot)
      expect(hydrated.values()).toEqual(before)
    }
  )
})
