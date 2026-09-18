import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'
import { anchorsOverlap } from './anchorsOverlap.js'
import { competitionIsLarger } from './competitionIsLarger.js'
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

  // Overlap handling
  // This never happens on splits, tho after they are fragments this can happend when anchor point is anchoring strip length
  if (anchorsOverlap(incomingStrip, rightStep!)) {
    firstCompetitor = rightStep
    let largerCompetitor: NonNullable<Strip<T>> | undefined
    let smallerCompetitor: Strip<T> = rightStep

    // Sort larger overlaps closer to anchor and smaller ones further.
    while (
      smallerCompetitor &&
      competitionIsLarger(incomingStrip, smallerCompetitor)
    ) {
      // Set competitor as larger.
      largerCompetitor = smallerCompetitor
      // Set the priorly right competitor of the larger competitor as smaller for next evaluation cycle.
      smallerCompetitor = smallerCompetitor.rightCompetitor
    }

    // Set found smaller competitor as the incoming competitors right competitor note this may be undefined
    incomingStrip.rightCompetitor = smallerCompetitor

    // If incoming strip was not the largest of competition set incomingStrip as rightCompetitor for the largest
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
