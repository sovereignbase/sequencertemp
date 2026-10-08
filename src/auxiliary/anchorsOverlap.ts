import type { Strip } from '../types/type.js'

/**
 * Determines whether two Strips share the exact canonical anchor point.
 *
 * @param incomingStrip Strip being positioned.
 * @param currentRightStep Existing Strip to compare.
 * @returns Whether anchor Session, start, and difference are identical.
 */
export function anchorsOverlap<T>(
  incomingStrip: NonNullable<Strip<T>>,
  currentRightStep: NonNullable<Strip<T>>
): boolean {
  return (
    incomingStrip.anchorSession === currentRightStep.anchorSession &&
    incomingStrip.anchorStart === currentRightStep.anchorStart &&
    incomingStrip.anchorDiff === currentRightStep.anchorDiff
  )
}
