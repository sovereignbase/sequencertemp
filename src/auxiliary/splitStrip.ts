import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'

/**
 * Splits one Strip into two fragments at a Frame position.
 *
 * The existing Strip becomes the left fragment while the newly created Strip
 * becomes its right fragment. The total Projection effect remains unchanged.
 *
 * @param this Projection containing the Strip.
 * @param anchoringStrip Strip to split.
 * @param afterFrame Positive number of Frames retained by the left fragment.
 * @returns Newly created right fragment.
 */
export function splitStrip<T>(
  this: Projection<T>,
  anchoringStrip: NonNullable<Strip<T>>,
  afterFrame: number
): NonNullable<Strip<T>> {
  // Anchor (strip | fragment) length.
  const anchoringStripDiff =
    anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff

  // When anchoring strip is of negative effect scalar is reducing, else increasing.
  const effect = anchoringStripDiff < 0 ? -1 : 1

  // Negative effect scalar makes left diff negative
  const leftDiff = effect * afterFrame // -1 *  7
  // Handles mask overlap/ownership by moving anchor to the right when left strip is a mask.
  // -7 - -3 = -5
  // Left reducing strip keeps owner ship of 2 overlapping frames
  const rightDiff = anchoringStripDiff - leftDiff

  // Cache (used more than once)
  const rightStep = anchoringStrip.rightStep
  const rightJump = anchoringStrip.rightJump

  const rightFragment: NonNullable<Strip<T>> = {
    anchorSession: anchoringStrip.anchorSession,
    anchorStart: anchoringStrip.anchorStart,
    anchorDiff: anchoringStrip.anchorDiff,

    insertionSession: anchoringStrip.insertionSession,
    insertionStart: anchoringStrip.insertionStart,
    insertionDiff: anchoringStrip.insertionDiff,

    // Only take reference.
    footage: anchoringStrip.footage,

    rightCompetitor: undefined,

    rightFragment: anchoringStrip.rightFragment,
    fragmentDiff: rightDiff,

    leftStep: anchoringStrip,
    leftJump: undefined,
    leftJumpFrameCount: 0,
    leftJumpStripCount: 0,

    rightStep,
    rightJump: undefined,
    rightJumpFrameCount: 0,
    rightJumpStripCount: 0,
  }
  // Update anchoring strip details.
  anchoringStrip.fragmentDiff = leftDiff
  anchoringStrip.rightFragment = rightFragment
  anchoringStrip.rightStep = rightFragment
  anchoringStrip.rightJump = undefined
  anchoringStrip.rightJumpFrameCount = 0
  anchoringStrip.rightJumpStripCount = 0

  if (rightJump) rightJump.leftJump = undefined
  // Set the right fragment of anchroing strip as left step for anchoring strips left step.
  if (rightStep) rightStep.leftStep = rightFragment
  // If there anchoring had no right step it was tail and now right fragment is new tail.
  else this.tail = rightFragment

  // Right fragment was added to structural order.
  ++this.structuralStripCount

  return rightFragment
}
