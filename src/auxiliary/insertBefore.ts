import type { Sequence } from '../class.js'
import type { Strip } from '../types/type.js'
import { splitStrip } from './splitStrip.js'
import { subtreeEnd } from './subtreeEnd.js'

/**
 * Covers insertion of all Strips anchored to a boundary marker,
 * A.K.A. a `zero-reservation`, such as head inserts and insertions
 * after the end of an existing Strip.
 *
 * @param this Sequence receiving the Strip.
 * @param incomingStrip Strip to insert.
 * @param containingStrip Strip containing the target Frame position.
 * @param targetFramePosition Target Frame position within the containing Strip.
 */
export function insertBefore<T>(
  this: Sequence<T>,
  incomingStrip: NonNullable<Strip<T>>,
  containingStrip: NonNullable<Strip<T>>,
  targetFramePosition: number
): void {
  const containingStripLength =
    containingStrip.fragmentLength ?? containingStrip.initialLength

  let leftStep: NonNullable<Strip<T>> = containingStrip
  let rightStep: Strip<T>

  if (targetFramePosition < containingStripLength) {
    rightStep = splitStrip.call(
      this,
      containingStrip,
      targetFramePosition
    ) as NonNullable<Strip<T>>
  } else {
    rightStep = containingStrip.rightStep
  }

  incomingStrip.rightCompetitor = undefined

  if (
    rightStep &&
    containingStrip.rightFragment !== rightStep &&
    rightStep.initialLength !== 0 &&
    rightStep.actorX === incomingStrip.actorX &&
    rightStep.timeX === incomingStrip.timeX &&
    rightStep.offsetLength === incomingStrip.offsetLength
  ) {
    let largerCompetitor: NonNullable<Strip<T>> | undefined
    let smallerCompetitor: Strip<T> = rightStep

    while (
      smallerCompetitor &&
      (incomingStrip.actorY < smallerCompetitor.actorY ||
        (incomingStrip.actorY === smallerCompetitor.actorY &&
          incomingStrip.timeY < smallerCompetitor.timeY))
    ) {
      largerCompetitor = smallerCompetitor
      smallerCompetitor = smallerCompetitor.rightCompetitor
    }

    incomingStrip.rightCompetitor = smallerCompetitor

    if (largerCompetitor) largerCompetitor.rightCompetitor = incomingStrip

    if (smallerCompetitor) {
      rightStep = smallerCompetitor
      leftStep = smallerCompetitor.leftStep!
    } else if (largerCompetitor) {
      leftStep = subtreeEnd.call(this, largerCompetitor) as NonNullable<
        Strip<T>
      >
      rightStep = leftStep.rightStep
    }
  }

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

  const frameCount = incomingStrip.fragmentLength ?? incomingStrip.initialLength

  this.visibleFrameCount += incomingStrip.type === 1 ? frameCount : -frameCount
}
