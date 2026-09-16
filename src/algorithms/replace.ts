import { findFrameByVisibleIndex } from '../auxiliary/findFrameByVisibleIndex.js'
import { findOriginalFramePosition } from '../auxiliary/findOriginalFramePosition.js'
import { insertAfter } from '../auxiliary/insertAfter.js'
import { insertBefore } from '../auxiliary/insertBefore.js'
import { patchJumps } from '../auxiliary/patchJumps.js'
import type { Sequence } from '../class.js'
import type { Gossip, Strip } from '../types/type.js'

export function replace<T>(
  this: Sequence<T>,
  withValues: Array<T>,
  startAt: number = 0,
  endAt: number = this.visibleFrameCount
): Gossip<T> {
  const insertions = []

  let remaining = endAt - startAt
  let replacementAnchor: Strip<T>
  let replacementLeftJumpToPatch: Strip<T>
  let replacementRightJumpToPatch: Strip<T>

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
      anchorSession: containingStrip.insertionSession,
      anchorTime: containingStrip.insertionTime,
      anchorFrame: findOriginalFramePosition(
        containingStrip,
        targetFramePosition
      ),
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

    if (!replacementAnchor) {
      replacementLeftJumpToPatch = this.leftJumpToPatch
      replacementRightJumpToPatch = this.rightJumpToPatch
    }

    patchJumps.call(
      this,
      decreasingStrip.insertionDiff,
      this.structuralStripCount - previousStructuralStripCount
    )

    this.containmentTable.set(decreasingStrip)
    replacementAnchor ??= decreasingStrip

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

  if (withValues.length !== 0) {
    let targetFramePosition: number
    let containingStrip: NonNullable<Strip<T>>

    if (replacementAnchor) {
      containingStrip = replacementAnchor
      targetFramePosition = 1
    } else if (startAt === this.visibleFrameCount) {
      containingStrip = this.tail!
      targetFramePosition = 1
      this.leftJumpToPatch = undefined
      this.rightJumpToPatch = undefined
    } else {
      targetFramePosition = findFrameByVisibleIndex.call(this, startAt)
      containingStrip = this.gate!
    }

    const increasingStrip: NonNullable<Strip<T>> = {
      anchorSession: containingStrip.insertionSession,
      anchorTime: containingStrip.insertionTime,
      anchorFrame: findOriginalFramePosition(
        containingStrip,
        targetFramePosition
      ),
      insertionSession: this.increaseClock[0],
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
      this.visibleIndex += increasingStrip.insertionDiff

    this.containmentTable.set(increasingStrip)
    this.gate = increasingStrip
    this.visibleIndex = startAt
    this.increaseClock[1] += withValues.length + 1

    insertions.push([
      increasingStrip.anchorSession,
      increasingStrip.anchorTime,
      increasingStrip.anchorFrame,
      increasingStrip.insertionSession,
      increasingStrip.insertionTime,
      increasingStrip.insertionDiff,
      increasingStrip.footage,
    ])
  }

  return insertions as Gossip<T>
}
