import type { Strip } from '../class.js'
import { anchorsOverlap } from './anchorsOverlap.js'

/**
 * Resolves a canonical anchor to its current materialized fragment.
 *
 * May adjust the incoming Strip's runtime fragment offset and effect for
 * already consumed Frames. Canonical insertion coordinates remain unchanged.
 *
 * @param origin Original Strip of the anchoring Insertion.
 * @param incomingStrip Strip whose anchor is being resolved.
 * @returns Resolved logical anchor point and the Strip containing it.
 */
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

    if (anchorIsWithinFragment) {
      if (
        incomingStrip.insertionDiff < 0 &&
        Math.abs(incomingStrip.insertionDiff) >
          fragmentEnd - incomingStrip.anchorDiff
      )
        incomingStrip.fragmentDiff =
          incomingStrip.anchorDiff - fragmentEnd

      break
    }

    let consumingMask = anchoringStrip.rightStep

    while (
      consumingMask &&
      consumingMask.anchorSession === origin.insertionSession &&
      consumingMask.anchorStart === origin.insertionStart &&
      ((consumingMask.fragmentDiff ?? consumingMask.insertionDiff) === 0 ||
        consumingMask.insertionDiff > 0 ||
        (incomingStrip.insertionDiff < 0
          ? incomingStrip.anchorDiff >= consumingMask.anchorDiff +
            (consumingMask.fragmentStart ?? 0) +
            Math.abs(consumingMask.fragmentDiff ?? consumingMask.insertionDiff)
          : incomingStrip.anchorDiff > consumingMask.anchorDiff +
            (consumingMask.fragmentStart ?? 0) +
            Math.abs(consumingMask.fragmentDiff ?? consumingMask.insertionDiff)))
    )
      consumingMask = consumingMask.insertionDiff > 0
        ? consumingMask.rightCompetitor
        : consumingMask.rightFragment &&
          (incomingStrip.insertionDiff < 0
            ? incomingStrip.anchorDiff >= consumingMask.anchorDiff +
              (consumingMask.rightFragment.fragmentStart ?? 0)
            : incomingStrip.anchorDiff > consumingMask.anchorDiff +
              (consumingMask.rightFragment.fragmentStart ?? 0))
          ? consumingMask.rightFragment
          : consumingMask.rightCompetitor ?? consumingMask.rightStep

    if (
      consumingMask &&
      consumingMask.insertionDiff < 0 &&
      consumingMask.anchorSession === origin.insertionSession &&
      consumingMask.anchorStart === origin.insertionStart
    ) {
      const maskStart = consumingMask.anchorDiff + (consumingMask.fragmentStart ?? 0)
      const maskEnd = maskStart + Math.abs(consumingMask.fragmentDiff ?? consumingMask.insertionDiff)
      const maskContainsAnchor =
        incomingStrip.insertionDiff < 0
          ? incomingStrip.anchorDiff >= maskStart &&
            incomingStrip.anchorDiff < maskEnd
          : incomingStrip.anchorDiff > maskStart &&
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
          Math.abs(incomingStrip.fragmentDiff ?? incomingStrip.insertionDiff),
          maskEnd - incomingStrip.anchorDiff
        )

        incomingStrip.fragmentStart = (incomingStrip.fragmentStart ?? 0) + consumed
        incomingStrip.fragmentDiff = incomingStrip.insertionDiff + incomingStrip.fragmentStart

        if (incomingStrip.fragmentDiff === 0)
          return [anchorDiff + consumed, consumingMask]

        const advancedAnchor = incomingStrip.anchorDiff + consumed
        let rightFragment = anchoringStrip.rightFragment!

        while (
          rightFragment &&
          advancedAnchor >=
          (rightFragment.fragmentStart ?? 0) +
            Math.abs(
              rightFragment.fragmentDiff ?? rightFragment.insertionDiff
            )
        )
          rightFragment = rightFragment.rightFragment!

        if (!rightFragment) {
          incomingStrip.fragmentStart = Math.abs(incomingStrip.insertionDiff)
          incomingStrip.fragmentDiff = 0
          return [anchorDiff + consumed, consumingMask]
        }

        const resolvedAnchor = Math.max(advancedAnchor, rightFragment.fragmentStart ?? 0)
        incomingStrip.fragmentStart = Math.min(
          -incomingStrip.insertionDiff,
          resolvedAnchor - incomingStrip.anchorDiff
        )
        incomingStrip.fragmentDiff = incomingStrip.insertionDiff + incomingStrip.fragmentStart
        return [resolvedAnchor, rightFragment]
      }
    }

    const rightFragment = anchoringStrip.rightFragment
    if (!rightFragment) break

    anchoringStrip = rightFragment
  }

  const anchorDiff = Math.max(incomingStrip.anchorDiff, anchoringStrip.fragmentStart ?? 0)
  if (incomingStrip.insertionDiff < 0 && anchorDiff > incomingStrip.anchorDiff) {
    incomingStrip.fragmentStart = Math.min(-incomingStrip.insertionDiff, anchorDiff - incomingStrip.anchorDiff)
    incomingStrip.fragmentDiff = incomingStrip.insertionDiff + incomingStrip.fragmentStart
  }
  return [anchorDiff, anchoringStrip]
}
