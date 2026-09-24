import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'
import { anchorsOverlap } from './anchorsOverlap.js'
import { competitionIsLarger } from './competitionIsLarger.js'
import { splitStrip } from './splitStrip.js'
import { subtreeEnd } from './subtreeEnd.js'

/**
 * Anchors a Strip into Structural Order.
 *
 * Places the incoming Strip immediately after the given anchor Frame,
 * unless other Strips already compete for the same anchor. In that case,
 * overlap handling determines the incoming Strip's position among the
 * competing sibling subtrees.
 *
 * If the anchor falls inside the anchoring Strip, the anchoring Strip is
 * first split so that the insertion point becomes a structural boundary.
 *
 * @param this Projection receiving the Strip.
 * @param incomingStrip Strip to anchor.
 * @param anchoringStrip Strip containing the anchor Frame.
 * @param anchorPoint Frame position within the anchoring Strip.
 */
export function anchorStrip<T>(
  this: Projection<T>,
  incomingStrip: NonNullable<Strip<T>>,
  anchoringStrip: NonNullable<Strip<T>>,
  anchorPoint: number
): void {
  // Structural length of the anchoring Strip or its current fragment.
  const anchoringStripLength = Math.abs(
    anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff
  )

  // Default insertion point is immediately after the anchoring Strip.
  let leftStep = anchoringStrip
  let rightStep: Strip<T>

  // Happy path: the anchor is already at the end of the anchoring Strip.
  if (anchorPoint === anchoringStripLength) {
    rightStep = anchoringStrip.rightStep
  } else {
    // The anchor is inside the Strip. Split it so that the right fragment
    // becomes the structural successor of the anchor point.
    rightStep = splitStrip.call(this, anchoringStrip, anchorPoint) as Strip<T>
  }

  // Overlap handling.
  //
  // A freshly created split cannot itself already have an overlapping
  // competitor at the new boundary. Once fragments exist, however, anchoring
  // at the end of a fragment may encounter Strips already using that anchor.
  if (rightStep && anchorsOverlap(incomingStrip, rightStep)) {
    // Closest known competitor that sorts larger than the incoming Strip.
    let largerCompetitor: NonNullable<Strip<T>> | undefined

    // Current competitor being tested as the first possible smaller sibling.
    let smallerCompetitor: Strip<T> = rightStep

    // Competitors form an ordered sibling chain through rightCompetitor.
    // Larger anchor overlaps stay closer to the anchor and smaller ones
    // further to the right.
    while (
      smallerCompetitor &&
      competitionIsLarger(incomingStrip, smallerCompetitor)
    ) {
      // Current competitor remains on the larger / anchor-facing side.
      largerCompetitor = smallerCompetitor

      // Continue with the next competitor further to the right.
      smallerCompetitor = smallerCompetitor.rightCompetitor
    }

    // The first smaller competitor becomes the incoming Strip's right competitor.
    // This may be undefined when the incoming Strip sorts last.
    incomingStrip.rightCompetitor = smallerCompetitor

    if (largerCompetitor) {
      // Insert the incoming Strip into the competitor chain.
      //
      // If a larger competitor exists, incoming follows it.
      // Otherwise incoming becomes the anchor-facing competitor.
      largerCompetitor.rightCompetitor = incomingStrip

      // A competitor occupies its whole subtree in Structural Order.
      // Therefore the incoming competitor must be inserted after the complete
      // subtree of the first larger competitor.
      leftStep = subtreeEnd(largerCompetitor)

      // Preserve whatever structurally followed that sibling subtree.
      // This may be another competitor or undefined at the tail.
      rightStep = leftStep.rightStep
    } else if (smallerCompetitor) {
      // No larger competitor exists, so incoming becomes the first sibling
      // in this competition and is placed directly before the current
      // smallest anchor-facing competitor.
      rightStep = smallerCompetitor

      // The smaller competitor's current predecessor is exactly where the
      // incoming Strip must attach. This may be the anchor itself or the end
      // of another sibling subtree.
      leftStep = smallerCompetitor.leftStep!
    }

    // Inserting after an existing competitor subtree may invalidate a cached
    // jump span that crosses the structural insertion point. Drop that span;
    // traversal will recreate an appropriate jump when needed.
    if (largerCompetitor && this.leftJumpToPatch && this.rightJumpToPatch) {
      this.leftJumpToPatch.rightJump = undefined
      this.rightJumpToPatch.leftJump = undefined
      this.leftJumpToPatch = undefined
      this.rightJumpToPatch = undefined
    }
  }

  // Link the incoming Strip between the resolved structural neighbours.
  incomingStrip.leftStep = leftStep
  incomingStrip.rightStep = rightStep

  leftStep.rightStep = incomingStrip

  if (rightStep) {
    rightStep.leftStep = incomingStrip
  } else {
    // No right neighbour means the incoming Strip becomes the structural tail.
    this.tail = incomingStrip
  }

  // A newly linked Strip starts without traversal jumps. Jumps are rebuilt
  // opportunistically by traversal according to current structural spacing.
  incomingStrip.leftJump = undefined
  incomingStrip.leftJumpFrameCount = 0
  incomingStrip.leftJumpStripCount = 0

  incomingStrip.rightJump = undefined
  incomingStrip.rightJumpFrameCount = 0
  incomingStrip.rightJumpStripCount = 0

  // Structural Order has gained exactly one Strip.
  ++this.structuralStripCount

  // Projection length changes by the signed effect of this Strip or fragment.
  this.projectionFrameCount +=
    incomingStrip.fragmentDiff ?? incomingStrip.insertionDiff
}
