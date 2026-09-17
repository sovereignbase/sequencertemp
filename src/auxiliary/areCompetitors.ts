import type { Strip } from '../types/type.js'

export function areCompetitors<T>(
  a: NonNullable<Strip<T>>,
  b: NonNullable<Strip<T>>
) {
  return (
    a.anchorSession === b.anchorSession &&
    a.anchorTime === b.anchorTime &&
    a.anchorFrame === b.anchorFrame
  )
}
