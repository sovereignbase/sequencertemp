import { findFrameByVisibleIndex } from '../auxiliary/findFrameByVisibleIndex.js'
import { insertAfter } from '../auxiliary/insertAfter.js'
import { insertBefore } from '../auxiliary/insertBefore.js'
import { patchJumps } from '../auxiliary/patchJumps.js'
import type { Sequence } from '../class.js'
import type { Delta, Strip } from '../types/type.js'

export function replace<T>(
  this: Sequence<T>,
  withValues: Array<T>,
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

    this.decreaseClock[1] += decreasingLength + 1

    const decreasingStrip: NonNullable<Strip<T>> = {
      anchorSequencer: containingStrip.insertionSequencer,
      anchorTime: containingStrip.insertionTime,
      anchorFrame: targetFramePosition,
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

    remaining -= decreasingLength
  }

  if (withValues.length !== 0) {
    let targetFramePosition: number
    let containingStrip: NonNullable<Strip<T>>

    if (startAt === this.visibleFrameCount) {
      containingStrip = this.tail!
      targetFramePosition = 1
    } else {
      targetFramePosition = findFrameByVisibleIndex.call(this, startAt)
      containingStrip = this.gate!
    }

    this.increaseClock[1] += withValues.length + 1

    const increasingStrip: NonNullable<Strip<T>> = {
      anchorSequencer: containingStrip.insertionSequencer,
      anchorTime: containingStrip.insertionTime,
      anchorFrame: targetFramePosition,
      insertionSequencer: this.increaseClock[0],
      insertionTime: this.increaseClock[1],
      insertionDiff: withValues.length,
      footage: withValues,
    }

    const previousStructuralStripCount = this.structuralStripCount

    if (targetFramePosition === 1)
      insertBefore.call(this, increasingStrip, containingStrip)
    else
      insertAfter.call(
        this,
        increasingStrip,
        containingStrip,
        targetFramePosition
      )

    patchJumps.call(
      this,
      increasingStrip.insertionDiff,
      this.structuralStripCount - previousStructuralStripCount
    )

    this.containmentTable.set(increasingStrip)

    insertions.push([
      increasingStrip.anchorSequencer,
      increasingStrip.anchorTime,
      increasingStrip.anchorFrame,
      increasingStrip.insertionSequencer,
      increasingStrip.insertionTime,
      increasingStrip.insertionDiff,
      increasingStrip.footage,
    ])
  }

  return insertions as Delta<T>
}
