import { findFrameByProjectionPosition } from '../auxiliary/findFrameByProjectionPosition.js'
import { findFrame } from '../auxiliary/findFrame.js'
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
    const targetFramePosition = findFrameByProjectionPosition.call(
      this,
      startAt
    )
    const containingStrip = this.gate!

    const containingStripLength = Math.abs(
      containingStrip.fragmentDiff ?? containingStrip.insertionDiff
    )

    const decreasingLength = Math.min(
      remaining,
      containingStripLength - targetFramePosition + 1
    )

    const decreasingStrip: NonNullable<Strip<T>> = {
      anchorSession: containingStrip.insertionSession,
      anchorStart: containingStrip.insertionStart,
      anchorDiff: findFrame(containingStrip, targetFramePosition),
      insertionSession: this.decreaseClock[0],
      insertionStart: this.decreaseClock[1],
      insertionDiff: -decreasingLength,
    }

    const previousStructuralStripCount = this.structuralStripCount

    void anchorStrip.call(
      this,
      decreasingStrip,
      containingStrip,
      targetFramePosition
    )

    void patchJumps.call(
      this,
      decreasingStrip.insertionDiff,
      this.structuralStripCount - previousStructuralStripCount
    )

    if (targetFramePosition === 1) {
      if ((this.gate!.fragmentDiff ?? this.gate!.insertionDiff) === 0)
        this.gate = this.gate!.rightFragment
      this.projectionFrameCount += decreasingStrip.insertionDiff
    }

    void this.containmentTable.set(decreasingStrip)

    void insertions.push([
      decreasingStrip.anchorSession,
      decreasingStrip.anchorStart,
      decreasingStrip.anchorDiff,
      decreasingStrip.insertionSession,
      decreasingStrip.anchorStart,
      decreasingStrip.insertionDiff,
    ])

    this.decreaseClock[1] += decreasingLength + 1

    remaining -= decreasingLength
  }

  return insertions
}
