import type { Strip } from '../class.js'

export function findContainingFragment<T>(
  origin: NonNullable<Strip<T>>,
  incomingStrip: NonNullable<Strip<T>>
): [number, NonNullable<Strip<T>>] {
  let anchoringStrip = origin
  while (true) {
    const fragmentStart = anchoringStrip.fragmentStart ?? 0
    const fragmentEnd =
      fragmentStart +
      Math.abs(anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff)

    if (
      incomingStrip.anchorDiff >= fragmentStart &&
      incomingStrip.anchorDiff <= fragmentEnd
    )
      break

    const rightFragment = anchoringStrip.rightFragment
    if (!rightFragment) break

    anchoringStrip = rightFragment
  }

  return [
    incomingStrip.anchorDiff -
      (incomingStrip.insertionDiff < 0 ? 1 : 0) -
      (anchoringStrip.fragmentStart ? anchoringStrip.fragmentStart - 1 : 0),
    anchoringStrip,
  ]
}
