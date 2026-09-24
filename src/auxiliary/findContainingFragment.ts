import type { Strip } from '../class.js'

export function findContainingFragment<T>(
  origin: NonNullable<Strip<T>>,
  incomingStrip: NonNullable<Strip<T>>
): [number, NonNullable<Strip<T>>] {
  let anchoringStrip = origin
  while (true) {
    const fragmentEnd =
      (anchoringStrip.fragmentStart ?? 0) +
      Math.abs(anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff)

    if (
      incomingStrip.anchorDiff < fragmentEnd ||
      (incomingStrip.anchorDiff === fragmentEnd &&
        anchoringStrip.rightFragment !== anchoringStrip.rightStep &&
        anchoringStrip.rightStep?.anchorSession ===
          incomingStrip.anchorSession &&
        anchoringStrip.rightStep.anchorStart === incomingStrip.anchorStart &&
        anchoringStrip.rightStep.anchorDiff === incomingStrip.anchorDiff)
    )
      break

    const rightFragment = anchoringStrip.rightFragment
    if (!rightFragment) break

    anchoringStrip = rightFragment
  }

  return [
    incomingStrip.anchorDiff - (anchoringStrip.fragmentStart ?? 0),
    anchoringStrip,
  ]
}
