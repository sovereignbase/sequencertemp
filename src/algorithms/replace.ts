import { findFramePositionByProjectionPosition } from '../auxiliary/findFramePositionByProjectionPosition.js'
import { anchorStrip } from '../auxiliary/anchorStrip.js'
import { patchJumps } from '../auxiliary/patchJumps.js'
import type { Projection } from '../class.js'
import type { Gossip, Strip } from '../types/type.js'

export function replace<T>(
  this: Projection<T>,
  withValues: Array<T>,
  startAt: number = 0,
  endWith: number = this.projectionFrameCount - 1
): Gossip<T> {
  const insertions = []

  let remaining = endWith - startAt + 1
  let replacementAnchor: Strip<T>
  let replacementLeftJumpToPatch: Strip<T>
  let replacementRightJumpToPatch: Strip<T>

  while (remaining > 0) {
    const framePosition = findFramePositionByProjectionPosition.call(
      this,
      startAt
    )
    const containingStrip = this.gate!
    const fragmentPosition =
      framePosition - (containingStrip.fragmentStart ?? 0)

    const containingStripLength = Math.abs(
      containingStrip.fragmentDiff ?? containingStrip.insertionDiff
    )

    const decreasingLength = Math.min(
      remaining,
      containingStripLength - fragmentPosition
    )

    const decreasingStrip: NonNullable<Strip<T>> = {
      anchorSession: containingStrip.insertionSession,
      anchorStart: containingStrip.insertionStart,
      anchorDiff: framePosition,
      insertionSession: this.decreaseClock[0],
      insertionStart: this.decreaseClock[1],
      insertionDiff: -decreasingLength,
    }

    const previousStructuralStripCount = this.structuralStripCount

    void anchorStrip.call(
      this,
      decreasingStrip,
      containingStrip,
      fragmentPosition
    )

    if (!replacementAnchor) {
      replacementLeftJumpToPatch = this.leftJumpToPatch
      replacementRightJumpToPatch = this.rightJumpToPatch
    }

    patchJumps.call(
      this,
      decreasingStrip.insertionDiff,
      this.structuralStripCount - previousStructuralStripCount
    )

    if (fragmentPosition === 0) {
      if ((this.gate!.fragmentDiff ?? this.gate!.insertionDiff) === 0)
        this.gate = this.gate!.rightFragment
      this.projectedPosition += decreasingStrip.insertionDiff
    }

    this.containmentTable.set(decreasingStrip)
    replacementAnchor ??= decreasingStrip

    insertions.push([
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

  if (withValues.length !== 0) {
    let anchorDiff: number
    let containingStrip: NonNullable<Strip<T>>

    if (replacementAnchor) {
      containingStrip = replacementAnchor
      anchorDiff = 0
    } else if (startAt === this.projectionFrameCount) {
      containingStrip = this.tail!
      anchorDiff =
        (containingStrip.fragmentStart ?? 0) +
        Math.abs(
          containingStrip.fragmentDiff ?? containingStrip.insertionDiff
        )
      this.leftJumpToPatch = undefined
      this.rightJumpToPatch = undefined
    } else {
      anchorDiff = findFramePositionByProjectionPosition.call(this, startAt)
      containingStrip = this.gate!
    }

    const increasingStrip: NonNullable<Strip<T>> = {
      anchorSession: containingStrip.insertionSession,
      anchorStart: containingStrip.insertionStart,
      anchorDiff,
      insertionSession: this.increaseClock[0],
      insertionStart: this.increaseClock[1],
      insertionDiff: withValues.length,
      footage: withValues,
    }

    const previousStructuralStripCount = this.structuralStripCount

    void anchorStrip.call(
      this,
      increasingStrip,
      containingStrip,
      anchorDiff - (containingStrip.fragmentStart ?? 0)
    )

    if (replacementAnchor) {
      this.leftJumpToPatch = replacementLeftJumpToPatch
      this.rightJumpToPatch = replacementRightJumpToPatch
    }

    patchJumps.call(
      this,
      increasingStrip.insertionDiff,
      this.structuralStripCount - previousStructuralStripCount
    )

    if (replacementAnchor && this.gate !== containingStrip)
      this.projectedPosition += increasingStrip.insertionDiff

    this.containmentTable.set(increasingStrip)
    this.gate = increasingStrip
    this.projectedPosition = startAt
    this.increaseClock[1] += withValues.length + 1

    insertions.push([
      increasingStrip.anchorSession,
      increasingStrip.anchorStart,
      increasingStrip.anchorDiff,
      increasingStrip.insertionSession,
      increasingStrip.insertionStart,
      increasingStrip.insertionDiff,
      increasingStrip.footage,
    ])
  }

  return insertions as Gossip<T>
}
