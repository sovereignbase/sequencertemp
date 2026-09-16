import { findFrameByVisibleIndex } from '../auxiliary/findFrameByVisibleIndex.js'
import { insertAfter } from '../auxiliary/insertAfter.js'
import { insertBefore } from '../auxiliary/insertBefore.js'
import { patchJumps } from '../auxiliary/patchJumps.js'
import type { Sequence } from '../class.js'
import type { Delta, Strip } from '../types/type.js'

export function remove<T>(
  this: Sequence<T>,
  startAt: number = 0,
  endAt: number = this.visibleFrameCount
): Delta<T> {
  const insertions = []

  let remaining = endAt - startAt

  while (remaining > 0) {
    const targetFramePosition = findFrameByVisibleIndex.call(this, startAt)
    const containingStrip = this.gate!

    const containingStripLength = Math.abs(
      containingStrip.fragmentDiff ?? containingStrip.insertionDiff
    )

    const decreasingLength = Math.min(
      remaining,
      containingStripLength - targetFramePosition + 1
    )

    const decreasingStrip: NonNullable<Strip<T>> = {
      anchorSequencer: containingStrip.insertionSequencer,
      anchorTime: containingStrip.insertionTime,
      anchorFrame:
        (containingStrip.fragmentFrame ?? 0) + targetFramePosition,
      insertionSequencer: this.decreaseClock[0],
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

    this.containmentTable.set(decreasingStrip)

    insertions.push([
      decreasingStrip.anchorSequencer,
      decreasingStrip.anchorTime,
      decreasingStrip.anchorFrame,
      decreasingStrip.insertionSequencer,
      decreasingStrip.insertionTime,
      decreasingStrip.insertionDiff,
    ])

    this.decreaseClock[1] += decreasingLength + 1

    remaining -= decreasingLength
  }

  return insertions
}
