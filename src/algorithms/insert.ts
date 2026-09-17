import { findFrameByProjectionPosition } from '../auxiliary/findFrameByProjectionPosition.js'
import { findFrame } from '../auxiliary/findFrame.js'
import { insertAfter } from '../auxiliary/insertAfter.js'
import { insertBefore } from '../auxiliary/insertBefore.js'
import { insertFirst } from '../auxiliary/insertFirst.js'
import { patchJumps } from '../auxiliary/patchJumps.js'
import type { Sequence } from '../class.js'
import type { Gossip, Strip } from '../types/type.js'

export function insert<T>(
  this: Sequence<T>,
  values: Array<T>,
  at: number
): Gossip<T> {
  if (this.structuralStripCount === 0) {
    const increasingStrip: NonNullable<Strip<T>> = {
      anchorSession: 0,
      anchorTime: 0,
      anchorFrame: 0,
      insertionSession: this.increaseClock[0],
      insertionTime: this.increaseClock[1],
      insertionDiff: values.length,
      footage: values,
    }

    insertFirst.call(this, increasingStrip)
    this.containmentTable.set(increasingStrip)
    this.increaseClock[1] += values.length + 1

    return [
      [
        increasingStrip.anchorSession,
        increasingStrip.anchorTime,
        increasingStrip.anchorFrame,
        increasingStrip.insertionSession,
        increasingStrip.insertionTime,
        increasingStrip.insertionDiff,
        increasingStrip.footage,
      ],
    ]
  }

  let targetFramePosition: number
  let containingStrip: NonNullable<Strip<T>>

  if (at === this.projectionFrameCount) {
    containingStrip = this.tail!
    targetFramePosition =
      Math.abs(containingStrip.fragmentDiff ?? containingStrip.insertionDiff) +
      1
    this.leftJumpToPatch = undefined
    this.rightJumpToPatch = undefined
  } else {
    targetFramePosition = findFrameByProjectionPosition.call(this, at)
    containingStrip = this.gate!
  }

  const increasingStrip: NonNullable<Strip<T>> = {
    anchorSession: containingStrip.insertionSession,
    anchorTime: containingStrip.insertionTime,
    anchorFrame: findFrame(containingStrip, targetFramePosition),
    insertionSession: this.increaseClock[0],
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
  this.gate = increasingStrip
  this.projectedPosition = at
  this.increaseClock[1] += values.length + 1

  return [
    [
      increasingStrip.anchorSession,
      increasingStrip.anchorTime,
      increasingStrip.anchorFrame,
      increasingStrip.insertionSession,
      increasingStrip.insertionTime,
      increasingStrip.insertionDiff,
      increasingStrip.footage,
    ],
  ]
}
