import { findFrameByVisibleIndex } from '../auxiliary/findFrameByVisibleIndex.js'
import { insertAfter } from '../auxiliary/insertAfter.js'
import { insertBefore } from '../auxiliary/insertBefore.js'
import { insertFirst } from '../auxiliary/insertFirst.js'
import type { Sequence } from '../class.js'
import type { Delta, Strip } from '../types/type.js'

export function insert<T>(
  this: Sequence<T>,
  values: Array<T>,
  at: number
): Delta<T> {
  this.increaseClock[1] += values.length + 1

  if (this.structuralStripCount === 0) {
    const strip: NonNullable<Strip<T>> = {
      anchorSequencer: 0,
      anchorTime: 0,
      anchorFrame: 0,
      insertionSequencer: this.increaseClock[0],
      insertionTime: this.increaseClock[1],
      insertionDiff: values.length,
      footage: values,
    }

    insertFirst.call(this, strip)

    return [
      strip.anchorSequencer,
      strip.anchorTime,
      strip.anchorFrame,
      strip.insertionSequencer,
      strip.insertionTime,
      strip.insertionDiff,
      strip.footage,
    ]
  }

  const targetFramePosition = findFrameByVisibleIndex.call(this, at)
  const containingStrip = this.gate!

  const strip: NonNullable<Strip<T>> = {
    anchorSequencer: containingStrip.insertionSequencer,
    anchorTime: containingStrip.insertionTime,
    anchorFrame: targetFramePosition,
    insertionSequencer: this.increaseClock[0],
    insertionTime: this.increaseClock[1],
    insertionDiff: values.length,
    footage: values,
  }
  // the visible index that should move right from under the insertion
  // uses a boundary marker when it is immediately after the end of a Strip
  if (targetFramePosition === 1) insertBefore.call(this, strip, containingStrip)
  else insertAfter.call(this, strip, containingStrip, targetFramePosition)

  return [
    strip.anchorSequencer,
    strip.anchorTime,
    strip.anchorFrame,
    strip.insertionSequencer,
    strip.insertionTime,
    strip.insertionDiff,
    strip.footage,
  ]
}
