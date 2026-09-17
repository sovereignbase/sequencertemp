import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'
import { areCompetitors } from './areCompetitors.js'
import { splitStrip } from './splitStrip.js'
import { subtreeEnd } from './subtreeEnd.js'

/**
 * Covers insertion of all Strips,
 * placing them after a given anchor Frame position
 * or a position determined by overlap handling rules.
 *
 * @param this Projection receiving the Strip.
 * @param incomingStrip Strip to anchor.
 * @param anchoringStrip Strip containing the anchor point.
 * @param anchorPoint Frame position within the anchoring Strip.
 */
export function anchorStrip<T>(
  this: Projection<T>,
  incomingStrip: NonNullable<Strip<T>>,
  anchoringStrip: NonNullable<Strip<T>>,
  anchorPoint: number
): void {
  const anchoringStripLength = Math.abs(
    anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff
  )

  let leftStep = anchoringStrip
  let rightStep: Strip<T>

  // Happy path
  if (anchorPoint === anchoringStripLength) {
    rightStep = anchoringStrip.rightStep
  } else {
    rightStep = splitStrip.call(this, anchoringStrip, anchorPoint) as Strip<T>
  }
  let firstCompetitor: Strip<T>
  if (areCompetitors(incomingStrip, rightStep!)) {
    firstCompetitor = rightStep
    let largerCompetitor: NonNullable<Strip<T>> | undefined
    let smallerCompetitor: Strip<T> = rightStep

    // Traverse to next to the first smaller competitor then self
    while (
      smallerCompetitor &&
      ((incomingStrip.insertionDiff < 0 &&
        smallerCompetitor.insertionDiff > 0) ||
        (incomingStrip.insertionDiff < 0 ===
          smallerCompetitor.insertionDiff < 0 &&
          (incomingStrip.insertionSession <
            smallerCompetitor.insertionSession ||
            (incomingStrip.insertionSession ===
              smallerCompetitor.insertionSession &&
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
    else if (rightStep) rightStep.rightCompetitor = incomingStrip

    if (largerCompetitor) {
      leftStep = subtreeEnd(largerCompetitor)
      rightStep = leftStep.rightStep
    } else if (smallerCompetitor) {
      rightStep = smallerCompetitor
      leftStep = smallerCompetitor.leftStep!
    }

    if (largerCompetitor && this.leftJumpToPatch && this.rightJumpToPatch) {
      this.leftJumpToPatch.rightJump = undefined
      this.rightJumpToPatch.leftJump = undefined
      this.leftJumpToPatch = undefined
      this.rightJumpToPatch = undefined
    }
  }

  if (!firstCompetitor && rightStep) rightStep.rightCompetitor = incomingStrip

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

  this.projectionFrameCount +=
    incomingStrip.fragmentDiff ?? incomingStrip.insertionDiff
}
