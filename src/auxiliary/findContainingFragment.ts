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
      Math.abs(anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff) -
      (anchoringStrip.fragmentStart ? 1 : 0)

    if (
      incomingStrip.anchorDiff >= fragmentStart &&
      incomingStrip.anchorDiff <= fragmentEnd &&
      !(
        incomingStrip.anchorDiff === fragmentEnd &&
        incomingStrip.insertionSession === anchoringStrip.insertionSession &&
        incomingStrip.insertionStart >=
          anchoringStrip.insertionStart +
            Math.abs(anchoringStrip.insertionDiff) +
            1
      )
    )
      break

    const rightFragment = anchoringStrip.rightFragment
    if (!rightFragment) break

    anchoringStrip = rightFragment
  }

  return [incomingStrip.anchorDiff, anchoringStrip]
}
