import type { Sequence } from '../class.js'
import type { Strip } from '../types/type.js'
import { splitStrip } from './splitStrip.js'
import { subtreeEnd } from './subtreeEnd.js'

/**
 * Covers insertion of all Strips anchored to a boundary marker,
 * A.K.A. using a `zero-reservation`, such as head inserts and insertions
 * after the end of an existing Strip.
 *
 * @param this Sequence receiving the Strip.
 * @param incomingStrip Strip to insert.
 * @param containingStrip Strip containing the target Frame position.
 */
export function insertBefore<T>(
  this: Sequence<T>,
  incomingStrip: NonNullable<Strip<T>>,
  containingStrip: NonNullable<Strip<T>>
): void {
  const containingStripLength = Math.abs(
    containingStrip.fragmentDiff ?? containingStrip.insertionDiff
  )

  let leftStep = containingStrip
  let rightStep: Strip<T>

  if (containingStripLength !== 0) {
    if (this.containmentTable.isRightFragment(containingStrip)) {
      leftStep = containingStrip.leftStep!
      rightStep = containingStrip

      if (containingStrip.leftJump) {
        this.leftJumpToPatch = containingStrip.leftJump
        this.rightJumpToPatch = containingStrip
      } else if (this.leftJumpToPatch === containingStrip) {
        this.leftJumpToPatch = undefined
        this.rightJumpToPatch = undefined
      }
    } else rightStep = splitStrip.call(this, containingStrip, 0) as Strip<T>
  } else rightStep = containingStrip.rightStep

  incomingStrip.rightCompetitor = undefined

  const birth =
    incomingStrip.anchorSequencer === 0 &&
    incomingStrip.anchorTime === 0 &&
    incomingStrip.anchorFrame === 0

  if (birth && !containingStrip.rightCompetitor)
    containingStrip.rightCompetitor = containingStrip.rightFragment

  const firstCompetitor = birth ? containingStrip.rightCompetitor : rightStep
  const directLeftStep = leftStep
  const directRightStep = rightStep

  if (
    firstCompetitor &&
    (containingStrip.rightFragment !== rightStep || birth) &&
    firstCompetitor.anchorSequencer === incomingStrip.anchorSequencer &&
    firstCompetitor.anchorTime === incomingStrip.anchorTime &&
    firstCompetitor.anchorFrame === incomingStrip.anchorFrame
  ) {
    let largerCompetitor: NonNullable<Strip<T>> | undefined
    let smallerCompetitor: Strip<T> = firstCompetitor

    while (
      smallerCompetitor &&
      ((incomingStrip.insertionDiff < 0 &&
        smallerCompetitor.insertionDiff > 0) ||
        (incomingStrip.insertionDiff < 0 ===
          smallerCompetitor.insertionDiff < 0 &&
          (incomingStrip.insertionSequencer <
            smallerCompetitor.insertionSequencer ||
            (incomingStrip.insertionSequencer ===
              smallerCompetitor.insertionSequencer &&
              incomingStrip.insertionTime >=
                smallerCompetitor.insertionTime +
                  Math.abs(smallerCompetitor.insertionDiff) +
                  1))))
    ) {
      largerCompetitor = smallerCompetitor
      smallerCompetitor = smallerCompetitor.rightCompetitor
    }

    incomingStrip.rightCompetitor = smallerCompetitor

    if (largerCompetitor) largerCompetitor.rightCompetitor = incomingStrip
    else if (birth) containingStrip.rightCompetitor = incomingStrip

    if (smallerCompetitor) {
      if (
        !largerCompetitor &&
        birth &&
        smallerCompetitor === containingStrip.rightFragment
      ) {
        leftStep = containingStrip
        rightStep = containingStrip.rightStep
      } else {
        rightStep = smallerCompetitor
        leftStep = smallerCompetitor.leftStep!
      }
    } else if (largerCompetitor) {
      leftStep = subtreeEnd(largerCompetitor)
      rightStep = leftStep.rightStep
    }
  }

  if (
    (leftStep !== directLeftStep || rightStep !== directRightStep) &&
    this.leftJumpToPatch &&
    this.rightJumpToPatch
  ) {
    this.leftJumpToPatch.rightJump = undefined
    this.rightJumpToPatch.leftJump = undefined
    this.leftJumpToPatch = undefined
    this.rightJumpToPatch = undefined
  }

  incomingStrip.leftStep = leftStep
  incomingStrip.rightStep = rightStep

  leftStep.rightStep = incomingStrip

  if (rightStep) rightStep.leftStep = incomingStrip
  else this.tail = incomingStrip

  incomingStrip.leftJump = undefined
  incomingStrip.leftJumpFrameCount = 0
  incomingStrip.leftJumpStripCount = 0

  incomingStrip.rightJump = undefined
  incomingStrip.rightJumpFrameCount = 0
  incomingStrip.rightJumpStripCount = 0

  ++this.structuralStripCount

  this.visibleFrameCount +=
    incomingStrip.fragmentDiff ?? incomingStrip.insertionDiff
}
