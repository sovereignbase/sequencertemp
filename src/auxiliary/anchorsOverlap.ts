import type { Strip } from '../types/type.js'

/**
 *
 * @param incomingStrip
 * @param currentRightStep
 * @returns
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
