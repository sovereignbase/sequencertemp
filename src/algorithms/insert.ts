import type { Projection } from '../class.js'
import type { Gossip, Strip } from '../types/type.js'

import { findFrame } from '../auxiliary/findFrame.js'
import { findFrameByProjectionPosition } from '../auxiliary/findFrameByProjectionPosition.js'
import { anchorStrip } from '../auxiliary/anchorStrip.js'
import { insertFirst } from '../auxiliary/insertFirst.js'
import { patchJumps } from '../auxiliary/patchJumps.js'

export function insert<T>(
  this: Projection<T>,
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

    void insertFirst.call(this, increasingStrip)
    void this.containmentTable.set(increasingStrip)
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

  let anchorFramePosition: number
  let anchoringStrip: NonNullable<Strip<T>>

  // Choose an anchor.
  if (at === this.projectionFrameCount) {
    anchoringStrip = this.tail!
    anchorFramePosition = Math.abs(
      anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff
    )
    this.leftJumpToPatch = undefined
    this.rightJumpToPatch = undefined
  } else {
    anchorFramePosition = findFrameByProjectionPosition.call(this, at)
    anchoringStrip = this.gate!

    // Use a boundary marker when at an strip boundary between strips.
    if (
      anchoringStrip.rightStep &&
      anchorFramePosition ==
        Math.abs(anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff)
    ) {
      anchorFramePosition = 0
      anchoringStrip = anchoringStrip.rightStep
    }
  }

  const increasingStrip: NonNullable<Strip<T>> = {
    anchorSession: anchoringStrip.insertionSession,
    anchorTime: anchoringStrip.insertionTime,
    anchorFrame: findFrame(anchoringStrip, anchorFramePosition),
    insertionSession: this.increaseClock[0],
    insertionTime: this.increaseClock[1],
    insertionDiff: values.length,
    footage: values,
  }

  const previousStructuralStripCount = this.structuralStripCount

  void anchorStrip.call(
    this,
    increasingStrip,
    anchoringStrip,
    anchorFramePosition
  )

  void patchJumps.call(
    this,
    increasingStrip.insertionDiff,
    this.structuralStripCount - previousStructuralStripCount
  )

  void this.containmentTable.set(increasingStrip)
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
