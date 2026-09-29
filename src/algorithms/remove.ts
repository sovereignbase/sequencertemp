import { findFramePositionByProjectionPosition } from '../auxiliary/findFramePositionByProjectionPosition.js'
import { anchorStrip } from '../auxiliary/anchorStrip.js'
import { patchJumps } from '../auxiliary/patchJumps.js'
import type { Projection } from '../class.js'
import type { Gossip, Strip } from '../types/type.js'
import { selectAnchor } from '../auxiliary/selectAnchor.js'

export function remove<T>(
  this: Projection<T>,
  startAt: number = 0,
  endWith: number = this.projectionFrameCount - 1
): Gossip<T> {
  const insertions = []

  let remaining = endWith - startAt + 1

  while (remaining > 0) {
    const [anchorDiff, anchoringStrip] = selectAnchor.call(this, startAt) as [
      number,
      NonNullable<Strip<T>>,
    ]

    const decreasingLength = Math.min(
      remaining,
      anchoringStrip.insertionDiff - anchorDiff + 1
    )

    const decreasingStrip: NonNullable<Strip<T>> = {
      anchorSession: anchoringStrip.insertionSession,
      anchorStart: anchoringStrip.insertionStart,
      anchorDiff: anchorDiff,
      insertionSession: this.decreaseClock[0],
      insertionStart: this.decreaseClock[1],
      insertionDiff: -decreasingLength,
    }

    const previousStructuralStripCount = this.structuralStripCount

    void anchorStrip.call(this, decreasingStrip, anchoringStrip, anchorDiff)

    void patchJumps.call(
      this,
      decreasingStrip.insertionDiff,
      this.structuralStripCount - previousStructuralStripCount
    )

    if (anchorDiff === 0) {
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
