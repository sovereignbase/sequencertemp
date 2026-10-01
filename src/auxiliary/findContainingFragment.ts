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
    ) {
      if (
        incomingStrip.insertionDiff < 0 &&
        Math.abs(incomingStrip.insertionDiff) >
          fragmentEnd - incomingStrip.anchorDiff
      )
        incomingStrip.fragmentDiff =
          incomingStrip.anchorDiff - fragmentEnd

      break
    }

    const consumingMask = anchoringStrip.rightStep

    if (
      consumingMask &&
      consumingMask.insertionDiff < 0 &&
      consumingMask.anchorSession === origin.insertionSession &&
      consumingMask.anchorStart === origin.insertionStart
    ) {
      const maskEnd =
        consumingMask.anchorDiff + Math.abs(consumingMask.insertionDiff)
      const maskContainsAnchor =
        incomingStrip.insertionDiff < 0
          ? incomingStrip.anchorDiff >= consumingMask.anchorDiff &&
            incomingStrip.anchorDiff < maskEnd
          : incomingStrip.anchorDiff > consumingMask.anchorDiff &&
            incomingStrip.anchorDiff <= maskEnd

      if (maskContainsAnchor && incomingStrip.insertionDiff > 0)
        return [
          incomingStrip.anchorDiff - consumingMask.anchorDiff,
          consumingMask,
        ]

      if (
        maskContainsAnchor &&
        consumingMask.insertionSession !== incomingStrip.insertionSession
      ) {
        const anchorDiff = incomingStrip.anchorDiff - consumingMask.anchorDiff
        const consumed = Math.min(
          Math.abs(incomingStrip.insertionDiff),
          Math.abs(consumingMask.insertionDiff) - anchorDiff
        )

        incomingStrip.fragmentStart = consumed
        incomingStrip.fragmentDiff = incomingStrip.insertionDiff + consumed

        if (incomingStrip.fragmentDiff === 0)
          return [anchorDiff + consumed, consumingMask]

        const rightStep = consumingMask.rightStep!
        return [rightStep.fragmentStart ?? 0, rightStep]
      }
    }

    const rightFragment = anchoringStrip.rightFragment
    if (!rightFragment) break

    anchoringStrip = rightFragment
  }

  return [incomingStrip.anchorDiff, anchoringStrip]
}
