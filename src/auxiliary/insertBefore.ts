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

  if (containingStripLength !== 0)
    rightStep = splitStrip.call(this, containingStrip, 0) as Strip<T>
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
      (incomingStrip.insertionSequencer <
        smallerCompetitor.insertionSequencer ||
        (incomingStrip.insertionSequencer ===
          smallerCompetitor.insertionSequencer &&
          incomingStrip.insertionTime < smallerCompetitor.insertionTime))
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
