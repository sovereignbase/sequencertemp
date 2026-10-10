import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'
import { anchorsOverlap } from './anchorsOverlap.js'
import { competitionIsLarger } from './competitionIsLarger.js'
import { splitStrip } from './splitStrip.js'
import { subtreeEnd } from './subtreeEnd.js'

/**
 * Anchors a Strip into Structural Order.
 *
 * Places the incoming Strip at the given logical anchor point,
 * unless other Strips already compete for the same anchor. In that case,
 * overlap handling determines the incoming Strip's position among the
 * competing sibling subtrees.
 *
 * If the anchor falls inside the anchoring Strip, the anchoring Strip is
 * first split so that the insertion point becomes a structural boundary.
 *
 * @param this Projection receiving the Strip.
 * @param incomingStrip Strip to anchor.
 * @param anchoringStrip Strip containing the logical anchor point, or undefined for
 * the virtual root anchor.
 * @param anchorDiff Resolved logical anchor point within the anchoring Insertion.
 * @returns Aggregate visible effect of the incoming Strip and its fragments.
 */
export function anchorStrip<T>(
  this: Projection<T>,
  incomingStrip: NonNullable<Strip<T>>,
  anchoringStrip: Strip<T>,
  anchorDiff: number
): number {
  // Retain the original mask's exclusive end before splitting its runtime effect across fragments.
  const removalEnd = incomingStrip.anchorDiff - incomingStrip.insertionDiff
  // Accumulate actual visible effects so a fragmented remote mask emits one total removal count.
  let projectionDiff = 0

  // Each continuation targets a later positive fragment of the same original Insertion.
  while (true) {
  let leftStep: Strip<T> = anchoringStrip
  let rightStep: Strip<T>
  let incomingDiff = incomingStrip.fragmentDiff ?? incomingStrip.insertionDiff

  // A mask targeting a positive fragment may consume only that fragment's remaining visible suffix.
  // Clamp available length to zero when earlier overlap already consumed the requested portion.
  if (incomingStrip.insertionDiff < 0 && anchoringStrip!.insertionDiff > 0) {
    incomingDiff = -Math.min(
      -incomingDiff,
      Math.max(0, (anchoringStrip!.fragmentStart ?? 0) +
        (anchoringStrip!.fragmentDiff ?? anchoringStrip!.insertionDiff) - anchorDiff)
    )
    incomingStrip.fragmentDiff = incomingDiff
  }
  // A fully overlapped mask still needs structural placement; clamp its placement point to the
  // current fragment's boundaries so splitting cannot create an out-of-range fragment.
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
    // Skip zero-effect nodes only when they share the canonical parent and have an earlier
    // anchor point; nodes at the same point must remain available for competition.
    (rightStep.fragmentDiff ?? rightStep.insertionDiff) === 0 &&
    rightStep.anchorSession === incomingStrip.anchorSession &&
    rightStep.anchorStart === incomingStrip.anchorStart &&
    rightStep.anchorDiff < incomingStrip.anchorDiff
  ) {
    leftStep = rightStep
    rightStep = rightStep.rightStep
  }

  // Competition applies only to exact immutable anchor triples, never to overlapping fragment ranges.
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
      // The last larger sibling is the immediate predecessor in competitor order;
      // its complete subtree remains before the incoming sibling in structural order.
      largerCompetitor.rightCompetitor = incomingStrip

      // A competitor occupies its whole subtree in Structural Order.
      // Therefore the incoming competitor must be inserted after the complete
      // subtree of the closest larger competitor.
      leftStep = subtreeEnd.call(this, largerCompetitor) as NonNullable<Strip<T>>

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

  // Link the incoming Strip between the resolved structural neighbours.
  incomingStrip.leftStep = leftStep
  incomingStrip.rightStep = rightStep

  // With a predecessor, splice into the existing graph; without one, replace structuralHead.
  if (leftStep) leftStep.rightStep = incomingStrip
  else this.structuralHead = incomingStrip

  // Only an existing successor has a reciprocal leftStep to repair.
  if (rightStep) {
    rightStep.leftStep = incomingStrip
  }

  // Only a Strip with positive runtime length can supply a visible boundary.
  if (incomingDiff > 0) {
    // An unset head, structural beginning, or direct insertion before head supplies the first visible Strip.
    if (!this.head || !leftStep || rightStep === this.head)
      this.head = incomingStrip
    // The symmetric adjacency cases supply the last visible Strip without an index traversal.
    if (!this.tail || !rightStep || leftStep === this.tail)
      this.tail = incomingStrip
  }

  // Deletion can turn the old first Strip into hidden history; skip it until a positive Strip remains.
  while (this.head && (this.head.fragmentDiff ?? this.head.insertionDiff) <= 0) {
    // A jump starting here may cross the new visible head; clear it during the existing boundary walk.
    if (this.head.rightJump && this.head.rightJumpFrameCount! > 0) {
      this.head.rightJump.leftJump = undefined
      this.head.rightJump = undefined
    }
    this.head = this.head.rightStep
  }

  // Likewise skip consumed suffix Strips so tail contains the last visible Frame.
  while (this.tail && (this.tail.fragmentDiff ?? this.tail.insertionDiff) <= 0) {
    // Likewise detach a jump ending beyond the new visible tail.
    if (this.tail.leftJump && this.tail.leftJumpFrameCount! > 0) {
      this.tail.leftJump.rightJump = undefined
      this.tail.leftJump = undefined
    }
    // A zero-Frame jump contains only hidden predecessors; skip their retained history.
    this.tail = this.tail.leftJump && this.tail.leftJumpFrameCount === 0
      ? this.tail.leftJump : this.tail.leftStep
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
  this.projectionFrameCount += incomingDiff
  // The visible counter and returned edit effect must include the same runtime contribution.
  projectionDiff += incomingDiff

  // Only a positive anchoring Insertion supplies further original Frame fragments to consume.
  const nextFragment = anchoringStrip && anchoringStrip.insertionDiff > 0
    ? anchoringStrip.rightFragment : undefined
  if (
    // Positive Insertions need no mask continuation. A mask stops without another positive
    // fragment, or when that fragment starts at or beyond the original exclusive removal end.
    incomingStrip.insertionDiff >= 0 ||
    !nextFragment ||
    (nextFragment.fragmentStart ?? 0) >= removalEnd
  ) return projectionDiff

  const fragmentStart = nextFragment.fragmentStart ?? 0
  // Continue the same canonical mask identity; allocate runtime metadata, not new Footage.
  const nextMask: NonNullable<Strip<T>> = {
    anchorSession: incomingStrip.anchorSession,
    anchorStart: incomingStrip.anchorStart,
    anchorDiff: incomingStrip.anchorDiff,
    insertionSession: incomingStrip.insertionSession,
    insertionStart: incomingStrip.insertionStart,
    insertionDiff: incomingStrip.insertionDiff,
    // Express this mask fragment's offset relative to the original mask's canonical anchor.
    fragmentStart: fragmentStart - incomingStrip.anchorDiff,
    // Clip to the next fragment's positive length and the remaining original removal interval.
    fragmentDiff: -Math.min(
      Math.max(0, nextFragment.fragmentDiff ?? nextFragment.insertionDiff),
      removalEnd - fragmentStart
    ),
  }
  // Preserve the mask's own fragment chain separately from the parent's fragment chain.
  incomingStrip.rightFragment = nextMask
  incomingStrip = nextMask
  anchoringStrip = nextFragment
  // Advance placement to the next positive fragment's start; canonical anchorDiff stays unchanged.
  anchorDiff = fragmentStart
  }
}
