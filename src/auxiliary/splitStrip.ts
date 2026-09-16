import type { Sequence } from '../class.js'
import type { Strip } from '../types/type.js'

/**
 * Splits one Strip into two fragments at a Frame position.
 *
 * The existing Strip becomes the left fragment while the newly created Strip
 * becomes its right fragment. The total Projection effect remains unchanged.
 *
 * @param this Sequence containing the Strip.
 * @param strip Strip to split.
 * @param framePosition Number of Frames retained by the left fragment.
 * @returns Newly created right fragment.
 */
export function splitStrip<T>(
  this: Sequence<T>,
  strip: NonNullable<Strip<T>>,
  framePosition: number
): NonNullable<Strip<T>> {
  const stripDiff = strip.fragmentDiff ?? strip.insertionDiff
  const direction = stripDiff < 0 ? -1 : 1

  const leftDiff = direction * framePosition
  const rightDiff = stripDiff - leftDiff

  const rightStep = strip.rightStep

  const rightFragment: NonNullable<Strip<T>> = {
    anchorSequencer: strip.anchorSequencer,
    anchorTime: strip.anchorTime,
    anchorFrame: strip.anchorFrame,

    insertionSequencer: strip.insertionSequencer,
    insertionTime: strip.insertionTime,
    insertionDiff: strip.insertionDiff,

    footage: strip.footage,

    rightCompetitor: undefined,

    rightFragment: strip.rightFragment,
    fragmentDiff: rightDiff,
    fragmentFrame: (strip.fragmentFrame ?? 0) + framePosition,

    leftStep: strip,
    leftJump: undefined,
    leftJumpFrameCount: 0,
    leftJumpStripCount: 0,

    rightStep,
    rightJump: undefined,
    rightJumpFrameCount: 0,
    rightJumpStripCount: 0,
  }

  strip.fragmentDiff = leftDiff
  strip.rightFragment = rightFragment
  strip.rightStep = rightFragment

  if (rightStep) rightStep.leftStep = rightFragment
  else this.tail = rightFragment

  ++this.structuralStripCount

  return rightFragment
}
