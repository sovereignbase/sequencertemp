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
 * @param anchoringStrip Strip containing the anchor Frame, or undefined for
 * the virtual root anchor.
 * @param anchorDiff Canonical anchor point within the anchoring Strip's original insertion.
 */
export function anchorStrip<T>(
  this: Projection<T>,
  incomingStrip: NonNullable<Strip<T>>,
  anchoringStrip: Strip<T>,
  anchorDiff: number
): number {
  const removalEnd = incomingStrip.anchorDiff - incomingStrip.insertionDiff
  let projectionDiff = 0

  while (true) {
  let leftStep: Strip<T> = anchoringStrip
  let rightStep: Strip<T>
  let incomingDiff = incomingStrip.fragmentDiff ?? incomingStrip.insertionDiff

  if (incomingStrip.insertionDiff < 0 && anchoringStrip!.insertionDiff > 0) {
    incomingDiff = -Math.min(
      -incomingDiff,
      Math.max(0, (anchoringStrip!.fragmentStart ?? 0) +
        (anchoringStrip!.fragmentDiff ?? anchoringStrip!.insertionDiff) - anchorDiff)
    )
    incomingStrip.fragmentDiff = incomingDiff
  }
  if (incomingStrip.insertionDiff < 0 && incomingDiff === 0)
    anchorDiff = Math.max(anchoringStrip!.fragmentStart ?? 0,
      Math.min(anchorDiff, (anchoringStrip!.fragmentStart ?? 0) +
        Math.abs(anchoringStrip!.fragmentDiff ?? anchoringStrip!.insertionDiff)))

  if (anchoringStrip) {
    // Structural length of the anchoring Strip or its current fragment.
    const anchoringStripLength = Math.abs(
      anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff
    )

    // The anchor is already at the end of the anchoring Strip.
    if (
      anchorDiff ===
      (anchoringStrip.fragmentStart ?? 0) + anchoringStripLength
    ) {
      rightStep = anchoringStrip.rightStep
    } else {
      // The anchor is inside the Strip. Split it so that the right fragment
      // becomes the structural successor of the anchor point.
      rightStep = splitStrip.call(
        this,
        anchoringStrip,
        anchorDiff,
        incomingDiff
      ) as Strip<T>
    }
  } else {
    // Root competitors share the virtual `(0, 0, 0)` anchor. `structuralHead` is the
    // anchor-facing root competitor; sibling placement still skips complete
    // trees through `subtreeEnd` below.
    rightStep = this.structuralHead
  }

  // Overlap handling.
  //
  // A freshly created split cannot itself already have an overlapping
  // competitor at the new boundary. Once fragments exist, however, anchoring
  // at the end of a fragment may encounter Strips already using that anchor.
  while (
    rightStep &&
    (rightStep.fragmentDiff ?? rightStep.insertionDiff) === 0 &&
    rightStep.anchorSession === incomingStrip.anchorSession &&
    rightStep.anchorStart === incomingStrip.anchorStart &&
    rightStep.anchorDiff < incomingStrip.anchorDiff
  ) {
    leftStep = rightStep
    rightStep = rightStep.rightStep
  }

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

  }

  // Any structural insertion invalidates the cached jump spanning its position.
  // Traversal recreates an appropriate jump when needed.
  if (this.leftJumpToPatch && this.rightJumpToPatch) {
    this.leftJumpToPatch.rightJump = undefined
    this.rightJumpToPatch.leftJump = undefined
    this.leftJumpToPatch = undefined
    this.rightJumpToPatch = undefined
  }

  if (leftStep?.rightJump) {
    leftStep.rightJump.leftJump = undefined
    leftStep.rightJump = undefined
  }

  // Link the incoming Strip between the resolved structural neighbours.
  incomingStrip.leftStep = leftStep
  incomingStrip.rightStep = rightStep

  if (leftStep) leftStep.rightStep = incomingStrip
  else this.structuralHead = incomingStrip

  if (rightStep) {
    rightStep.leftStep = incomingStrip
  }

  if (incomingDiff > 0) {
    if (!this.head || !leftStep || rightStep === this.head)
      this.head = incomingStrip
    if (!this.tail || !rightStep || leftStep === this.tail)
      this.tail = incomingStrip
  }

  while (this.head && (this.head.fragmentDiff ?? this.head.insertionDiff) <= 0)
    this.head = this.head.rightStep

  while (this.tail && (this.tail.fragmentDiff ?? this.tail.insertionDiff) <= 0)
    this.tail = this.tail.leftStep

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
  this.projectionFrameCount += incomingDiff
  projectionDiff += incomingDiff

  const nextFragment = anchoringStrip && anchoringStrip.insertionDiff > 0
    ? anchoringStrip.rightFragment : undefined
  if (
    incomingStrip.insertionDiff >= 0 ||
    !nextFragment ||
    (nextFragment.fragmentStart ?? 0) >= removalEnd
  ) return projectionDiff

  const fragmentStart = nextFragment.fragmentStart ?? 0
  const nextMask: NonNullable<Strip<T>> = {
    anchorSession: incomingStrip.anchorSession,
    anchorStart: incomingStrip.anchorStart,
    anchorDiff: incomingStrip.anchorDiff,
    insertionSession: incomingStrip.insertionSession,
    insertionStart: incomingStrip.insertionStart,
    insertionDiff: incomingStrip.insertionDiff,
    fragmentStart: fragmentStart - incomingStrip.anchorDiff,
    fragmentDiff: -Math.min(
      Math.max(0, nextFragment.fragmentDiff ?? nextFragment.insertionDiff),
      removalEnd - fragmentStart
    ),
  }
  incomingStrip.rightFragment = nextMask
  incomingStrip = nextMask
  anchoringStrip = nextFragment
  anchorDiff = fragmentStart
  }
}
