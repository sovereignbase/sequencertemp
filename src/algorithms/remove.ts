import { findFramePositionByProjectionPosition } from '../auxiliary/findFramePositionByProjectionPosition.js'
import { anchorStrip } from '../auxiliary/anchorStrip.js'
import { patchJumps } from '../auxiliary/patchJumps.js'
import type { Projection } from '../class.js'
import type { Gossip, Strip } from '../types/type.js'

export function remove<T>(
  this: Projection<T>,
  startAt: number = 0,
  endWith: number = this.projectionFrameCount - 1
): Gossip<T> {
  const insertions = []

  let remaining = endWith - startAt + 1

  while (remaining > 0) {
    const framePosition = findFramePositionByProjectionPosition.call(
      this,
      startAt
    )
    const containingStrip = this.gate!
    const fragmentPosition =
      framePosition -
      (containingStrip.fragmentStart ? containingStrip.fragmentStart - 1 : 0)

    const containingStripLength = Math.abs(
      containingStrip.fragmentDiff ?? containingStrip.insertionDiff
    )

    const decreasingLength = Math.min(
      remaining,
      containingStripLength - fragmentPosition
    )

    const decreasingStrip: NonNullable<Strip<T>> = {
      anchorSession: containingStrip.insertionSession,
      anchorStart: containingStrip.insertionStart,
      anchorDiff: framePosition + 1,
      insertionSession: this.decreaseClock[0],
      insertionStart: this.decreaseClock[1],
      insertionDiff: -decreasingLength,
    }

    const previousStructuralStripCount = this.structuralStripCount

    void anchorStrip.call(
      this,
      decreasingStrip,
      containingStrip,
      decreasingStrip.anchorDiff
    )

    void patchJumps.call(
      this,
      decreasingStrip.insertionDiff,
      this.structuralStripCount - previousStructuralStripCount
    )

    if (fragmentPosition === 0) {
      if ((this.gate!.fragmentDiff ?? this.gate!.insertionDiff) === 0)
        this.gate = this.gate!.rightFragment
      this.projectedPosition += decreasingStrip.insertionDiff
    }

    void this.containmentTable.set(decreasingStrip)

    void insertions.push([
      decreasingStrip.anchorSession,
      decreasingStrip.anchorStart,
      decreasingStrip.anchorDiff,
      decreasingStrip.insertionSession,
      decreasingStrip.insertionStart,
      decreasingStrip.insertionDiff,
    ])

    this.decreaseClock[1] += decreasingLength + 1

    remaining -= decreasingLength
  }

  return insertions
}
