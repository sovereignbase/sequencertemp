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
 * @param afterFrame Number of Frames retained by the left fragment.
 * @returns Newly created right fragment.
 */
export function splitStrip<T>(
  this: Projection<T>,
  anchoringStrip: NonNullable<Strip<T>>,
  afterFrame: number
): NonNullable<Strip<T>> {
  const anchoringStripDiff =
    anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff
  const direction = anchoringStripDiff < 0 ? -1 : 1

  const leftDiff = direction * afterFrame
  const rightDiff = anchoringStripDiff - leftDiff

  const rightStep = anchoringStrip.rightStep
  const rightJump = anchoringStrip.rightJump

  const rightFragment: NonNullable<Strip<T>> = {
    anchorSession: anchoringStrip.anchorSession,
    anchorStart: anchoringStrip.anchorStart,
    anchorDiff: anchoringStrip.anchorDiff,

    insertionSession: anchoringStrip.insertionSession,
    insertionStart: anchoringStrip.insertionStart,
    insertionDiff: anchoringStrip.insertionDiff,

    // only take reference
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

  anchoringStrip.fragmentDiff = leftDiff
  anchoringStrip.rightFragment = rightFragment
  anchoringStrip.rightStep = rightFragment

  anchoringStrip.rightJump = undefined
  anchoringStrip.rightJumpFrameCount = 0
  anchoringStrip.rightJumpStripCount = 0

  if (rightJump) rightJump.leftJump = undefined

  if (rightStep) rightStep.leftStep = rightFragment
  else this.tail = rightFragment

  ++this.structuralStripCount

  return rightFragment
}
