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
  let boundaryStrip: Strip<T>

  if (targetFramePosition <= containingStripLength) {
    rightStep = splitStrip.call(
      this,
      containingStrip,
      targetFramePosition - 1
    ) as Strip<T>
    boundaryStrip = rightStep
  } else rightStep = containingStrip.rightStep

  incomingStrip.rightCompetitor = undefined

  const firstCompetitor = boundaryStrip?.rightCompetitor ?? rightStep

  if (
    firstCompetitor &&
    firstCompetitor.anchorSession === incomingStrip.anchorSession &&
    firstCompetitor.anchorTime === incomingStrip.anchorTime &&
    firstCompetitor.anchorFrame === incomingStrip.anchorFrame
  ) {
    let largerCompetitor: NonNullable<Strip<T>> | undefined
    let smallerCompetitor: Strip<T> = firstCompetitor

    while (
      smallerCompetitor &&
      smallerCompetitor.anchorSession === incomingStrip.anchorSession &&
      smallerCompetitor.anchorTime === incomingStrip.anchorTime &&
      smallerCompetitor.anchorFrame === incomingStrip.anchorFrame &&
      (incomingStrip.insertionSession < smallerCompetitor.insertionSession ||
        (incomingStrip.insertionSession ===
          smallerCompetitor.insertionSession &&
          incomingStrip.insertionTime >=
            smallerCompetitor.insertionTime +
              Math.abs(smallerCompetitor.insertionDiff) +
              1))
    ) {
      largerCompetitor = smallerCompetitor
      smallerCompetitor = smallerCompetitor.rightCompetitor
    }

    if (
      smallerCompetitor &&
      (smallerCompetitor.anchorSession !== incomingStrip.anchorSession ||
        smallerCompetitor.anchorTime !== incomingStrip.anchorTime ||
        smallerCompetitor.anchorFrame !== incomingStrip.anchorFrame)
    )
      smallerCompetitor = undefined

    incomingStrip.rightCompetitor = smallerCompetitor

    if (largerCompetitor) largerCompetitor.rightCompetitor = incomingStrip
    else if (boundaryStrip) boundaryStrip.rightCompetitor = incomingStrip

    if (smallerCompetitor) {
      rightStep = smallerCompetitor
      leftStep = smallerCompetitor.leftStep!
    } else if (largerCompetitor) {
      leftStep = subtreeEnd(largerCompetitor)
      rightStep = leftStep.rightStep
    }

    if (largerCompetitor && this.leftJumpToPatch && this.rightJumpToPatch) {
      this.leftJumpToPatch.rightJump = undefined
      this.rightJumpToPatch.leftJump = undefined
      this.leftJumpToPatch = undefined
      this.rightJumpToPatch = undefined
    }
  }

  if (!firstCompetitor && boundaryStrip)
    boundaryStrip.rightCompetitor = incomingStrip

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
