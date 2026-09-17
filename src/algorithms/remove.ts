import { findFrameByProjectionPosition } from '../auxiliary/findFrameByProjectionPosition.js'
import { findFrame } from '../auxiliary/findFrame.js'
import { insertAfter } from '../auxiliary/insertAfter.js'
import { insertBefore } from '../auxiliary/insertBefore.js'
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
      anchorTime: containingStrip.insertionTime,
      anchorFrame: findFrame(containingStrip, targetFramePosition),
      insertionSession: this.decreaseClock[0],
      insertionTime: this.decreaseClock[1],
      insertionDiff: -decreasingLength,
    }

    const previousStructuralStripCount = this.structuralStripCount

    if (targetFramePosition === 1)
      insertBefore.call(this, decreasingStrip, containingStrip)
    else
      insertAfter.call(
        this,
        decreasingStrip,
        containingStrip,
        targetFramePosition
      )

    patchJumps.call(
      this,
      decreasingStrip.insertionDiff,
      this.structuralStripCount - previousStructuralStripCount
    )

    if (targetFramePosition === 1) {
      if ((this.gate!.fragmentDiff ?? this.gate!.insertionDiff) === 0)
        this.gate = this.gate!.rightFragment
      this.projectionFrameCount += decreasingStrip.insertionDiff
    }

    this.containmentTable.set(decreasingStrip)

    insertions.push([
      decreasingStrip.anchorSession,
      decreasingStrip.anchorTime,
      decreasingStrip.anchorFrame,
      decreasingStrip.insertionSession,
      decreasingStrip.insertionTime,
      decreasingStrip.insertionDiff,
    ])

    this.decreaseClock[1] += decreasingLength + 1

    remaining -= decreasingLength
  }

  return insertions
}
