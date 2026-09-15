import { findFrameByVisibleIndex } from '../auxiliary/findFrameByVisibleIndex.js'
import { insertAfter } from '../auxiliary/insertAfter.js'
import { insertBefore } from '../auxiliary/insertBefore.js'
import { patchJumps } from '../auxiliary/patchJumps.js'
import type { Sequence } from '../class.js'
import type { Delta, Strip } from '../types/type.js'

export function replace<T>(
  this: Sequence<T>,
  values: Array<T>,
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

    // the deletion starts at a visible index that uses a boundary marker
    // as its anchor when it is immediately after the end of a Strip
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

  if (values.length !== 0) {
    const targetFramePosition = findFrameByVisibleIndex.call(this, startAt)
    const containingStrip = this.gate!

    this.increaseClock[1] += values.length + 1

    const increasingStrip: NonNullable<Strip<T>> = {
      anchorSequencer: containingStrip.insertionSequencer,
      anchorTime: containingStrip.insertionTime,
      anchorFrame: targetFramePosition,
      insertionSequencer: this.increaseClock[0],
      insertionTime: this.increaseClock[1],
      insertionDiff: values.length,
      footage: values,
    }

    const previousStructuralStripCount = this.structuralStripCount

    // the visible index that should move right from under the insertion
    // uses a boundary marker when it is immediately after the end of a Strip
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
