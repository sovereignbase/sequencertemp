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

    const anchorIsWithinFragment =
      incomingStrip.insertionDiff < 0
        ? incomingStrip.anchorDiff >= fragmentStart &&
          incomingStrip.anchorDiff < fragmentEnd
        : incomingStrip.anchorDiff >= fragmentStart &&
          incomingStrip.anchorDiff <= fragmentEnd

    if (
      anchorIsWithinFragment &&
      !(
        incomingStrip.anchorDiff === fragmentEnd &&
        incomingStrip.insertionSession === anchoringStrip.insertionSession &&
        incomingStrip.insertionStart >=
          anchoringStrip.insertionStart + Math.abs(anchoringStrip.insertionDiff)
      )
    )
      break

    const consumingMask = anchoringStrip.rightStep

    if (
      consumingMask &&
      consumingMask.insertionDiff < 0 &&
      consumingMask.anchorSession === origin.insertionSession &&
      consumingMask.anchorStart === origin.insertionStart
    ) {
      const maskEnd =
        consumingMask.anchorDiff +
        Math.abs(consumingMask.insertionDiff)

      if (
        incomingStrip.insertionDiff < 0 &&
        incomingStrip.anchorDiff >= consumingMask.anchorDiff &&
        incomingStrip.anchorDiff < maskEnd
      ) {
        const consumed = Math.min(
          Math.abs(incomingStrip.insertionDiff),
          maskEnd - incomingStrip.anchorDiff
        )

        incomingStrip.fragmentStart = consumed
        incomingStrip.fragmentDiff = incomingStrip.insertionDiff + consumed

        if (incomingStrip.anchorDiff === consumingMask.anchorDiff)
          return [
            Math.abs(
              anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff
            ),
            anchoringStrip,
          ]
      } else if (
        incomingStrip.insertionDiff > 0 &&
        incomingStrip.anchorDiff > consumingMask.anchorDiff &&
        incomingStrip.anchorDiff <= maskEnd
      ) {
        return [
          incomingStrip.anchorDiff - consumingMask.anchorDiff,
          consumingMask,
        ]
      }
    }

    const rightFragment = anchoringStrip.rightFragment
    if (!rightFragment) break

    anchoringStrip = rightFragment
  }

  return [incomingStrip.anchorDiff, anchoringStrip]
}
