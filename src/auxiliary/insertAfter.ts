import type { Sequence } from '../class.js'
import type { Strip } from '../types/type.js'
import { splitStrip } from './splitStrip.js'
import { subtreeEnd } from './subtreeEnd.js'

/**
 * Covers insertion of all Strips NOT anchored to a boundary marker,
 * A.K.A. not using a `zero-reservation`, such as tail inserts and
 * insertions within an existing Strip.
 *
 * @param this Sequence receiving the Strip.
 * @param incomingStrip Strip to insert.
 * @param containingStrip Strip containing the target Frame position.
 * @param targetFramePosition Target Frame position within the containing Strip.
 */
export function insertAfter<T>(
  this: Sequence<T>,
  incomingStrip: NonNullable<Strip<T>>,
  containingStrip: NonNullable<Strip<T>>,
  targetFramePosition: number
): void {
  const containingStripLength = Math.abs(
    containingStrip.fragmentDiff ?? containingStrip.insertionDiff
  )

  let leftStep = containingStrip
  let rightStep: Strip<T>

  if (targetFramePosition <= containingStripLength)
    rightStep = splitStrip.call(
      this,
      containingStrip,
      targetFramePosition - 1
    ) as Strip<T>
  else rightStep = containingStrip.rightStep

  incomingStrip.rightCompetitor = undefined

  if (
    rightStep &&
    (containingStrip.rightFragment !== rightStep ||
      (incomingStrip.anchorSequencer === 0 &&
        incomingStrip.anchorTime === 0 &&
        incomingStrip.anchorFrame === 0)) &&
    rightStep.anchorSequencer === incomingStrip.anchorSequencer &&
    rightStep.anchorTime === incomingStrip.anchorTime &&
    rightStep.anchorFrame === incomingStrip.anchorFrame
  ) {
    let largerCompetitor: NonNullable<Strip<T>> | undefined
    let smallerCompetitor: Strip<T> = rightStep

    while (
      smallerCompetitor &&
      ((incomingStrip.insertionDiff < 0 &&
        smallerCompetitor.insertionDiff > 0) ||
        ((incomingStrip.insertionDiff < 0) ===
          (smallerCompetitor.insertionDiff < 0) &&
          (incomingStrip.insertionSequencer <
            smallerCompetitor.insertionSequencer ||
            (incomingStrip.insertionSequencer ===
              smallerCompetitor.insertionSequencer &&
              incomingStrip.insertionTime -
                Math.abs(incomingStrip.insertionDiff) -
                1 >=
                smallerCompetitor.insertionTime))))
    ) {
      largerCompetitor = smallerCompetitor
      smallerCompetitor = smallerCompetitor.rightCompetitor
    }

    incomingStrip.rightCompetitor = smallerCompetitor

    if (largerCompetitor) largerCompetitor.rightCompetitor = incomingStrip

    if (smallerCompetitor) {
      rightStep = smallerCompetitor
      leftStep = smallerCompetitor.leftStep!
    } else if (largerCompetitor) {
      leftStep = subtreeEnd(largerCompetitor)
      rightStep = leftStep.rightStep
    }

    if (
      largerCompetitor &&
      this.leftJumpToPatch &&
      this.rightJumpToPatch
    ) {
      this.leftJumpToPatch.rightJump = undefined
      this.rightJumpToPatch.leftJump = undefined
      this.leftJumpToPatch = undefined
      this.rightJumpToPatch = undefined
    }
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
