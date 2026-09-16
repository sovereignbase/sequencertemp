import { findFrameByVisibleIndex } from '../auxiliary/findFrameByVisibleIndex.js'
import { insertAfter } from '../auxiliary/insertAfter.js'
import { insertBefore } from '../auxiliary/insertBefore.js'
import { insertFirst } from '../auxiliary/insertFirst.js'
import { patchJumps } from '../auxiliary/patchJumps.js'
import type { Sequence } from '../class.js'
import type { Delta, Strip } from '../types/type.js'

export function insert<T>(
  this: Sequence<T>,
  values: Array<T>,
  at: number
): Delta<T> {
  if (this.structuralStripCount === 0) {
    const increasingStrip: NonNullable<Strip<T>> = {
      anchorSequencer: 0,
      anchorTime: 0,
      anchorFrame: 0,
      insertionSequencer: this.increaseClock[0],
      insertionTime: this.increaseClock[1],
      insertionDiff: values.length,
      footage: values,
    }

    insertFirst.call(this, increasingStrip)
    this.containmentTable.set(increasingStrip)
    this.increaseClock[1] += values.length + 1

    return [
      [
        increasingStrip.anchorSequencer,
        increasingStrip.anchorTime,
        increasingStrip.anchorFrame,
        increasingStrip.insertionSequencer,
        increasingStrip.insertionTime,
        increasingStrip.insertionDiff,
        increasingStrip.footage,
      ],
    ]
  }

  let targetFramePosition: number
  let containingStrip: NonNullable<Strip<T>>

  if (at === this.visibleFrameCount) {
    containingStrip = this.tail!
    targetFramePosition =
      Math.abs(
        containingStrip.fragmentDiff ?? containingStrip.insertionDiff
      ) + 1
  } else {
    targetFramePosition = findFrameByVisibleIndex.call(this, at)
    containingStrip = this.gate!
  }

  const increasingStrip: NonNullable<Strip<T>> = {
    anchorSequencer: containingStrip.insertionSequencer,
    anchorTime: containingStrip.insertionTime,
    anchorFrame:
      (containingStrip.fragmentFrame ?? 0) + targetFramePosition,
    insertionSequencer: this.increaseClock[0],
    insertionTime: this.increaseClock[1],
    insertionDiff: values.length,
    footage: values,
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
  this.increaseClock[1] += values.length + 1

  return [
    [
      increasingStrip.anchorSequencer,
      increasingStrip.anchorTime,
      increasingStrip.anchorFrame,
      increasingStrip.insertionSequencer,
      increasingStrip.insertionTime,
      increasingStrip.insertionDiff,
      increasingStrip.footage,
    ],
  ]
}
