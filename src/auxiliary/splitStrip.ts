import type { Sequence } from '../class.js'
import type { Strip } from '../types/type.js'

/**
 * Splits one Strip at a Frame position without changing its Projection effect.
 *
 * The existing Strip becomes the left fragment and a new Strip becomes the
 * right fragment.
 *
 * @param this Sequence containing the Strip.
 * @param strip Strip to split.
 * @param framePosition Number of Frames retained in the left fragment.
 * @returns Newly created right fragment.
 */
export function splitStrip<T>(
  this: Sequence<T>,
  strip: NonNullable<Strip<T>>,
  framePosition: number
): NonNullable<Strip<T>> {
  const stripLength = strip.fragmentLength ?? strip.initialLength
  const rightStep = strip.rightStep

  const rightFragment: NonNullable<Strip<T>> = {
    type: strip.type,
    depencyPrefix: strip.depencyPrefix + framePosition,
    initialLength: 0,
    offsetLength: strip.offsetLength + framePosition,
    actorX: strip.actorX,
    timeX: strip.timeX,
    actorY: strip.actorY,
    timeY: strip.timeY,

    // Fragments share the original Footage.
    footage: strip.footage,

    rightFragment: strip.rightFragment,
    fragmentLength: stripLength - framePosition,

    rightCompetitor: undefined,

    leftStep: strip,
    rightStep,

    leftJump: undefined,
    leftJumpFrameCount: 0,
    leftJumpStripCount: 0,

    rightJump: undefined,
    rightJumpFrameCount: 0,
    rightJumpStripCount: 0,
  }

  strip.fragmentLength = framePosition
  strip.rightFragment = rightFragment
  strip.rightStep = rightFragment

  if (rightStep) rightStep.leftStep = rightFragment
  else this.tail = rightFragment

  ++this.structuralStripCount

  return rightFragment
}
