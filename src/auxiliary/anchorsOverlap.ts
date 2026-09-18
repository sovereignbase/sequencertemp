import type { Strip } from '../types/type.js'

export function anchorsOverlap<T>(
  incomingStrip: NonNullable<Strip<T>>,
  currentRightStep: NonNullable<Strip<T>>
) {
  return (
    incomingStrip.anchorSession === currentRightStep.anchorSession &&
    incomingStrip.anchorStart === currentRightStep.anchorStart &&
    incomingStrip.anchorDiff === currentRightStep.anchorDiff
  )
}
