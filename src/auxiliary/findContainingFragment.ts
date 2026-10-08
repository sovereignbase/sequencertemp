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
  // Containment supplies the original Strip in constant time; resolve only through its right-side materialization.
  let anchoringStrip = origin
  while (true) {
    // Offsets stay in the original Insertion's coordinates; runtime fragmentation never renumbers Footage.
    const fragmentStart = anchoringStrip.fragmentStart ?? 0
    // Use the current fragment's magnitude to locate its right logical boundary for either effect direction.
    const fragmentEnd =
      fragmentStart +
      Math.abs(anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff)

    // A mask must start on a Frame, so its right bound is exclusive. A positive Insertion
    // may use either boundary point, including the right end, so its right bound is inclusive.
    const anchorIsWithinFragment =
      incomingStrip.insertionDiff < 0
        ? incomingStrip.anchorDiff >= fragmentStart &&
          incomingStrip.anchorDiff < fragmentEnd
        : incomingStrip.anchorDiff >= fragmentStart &&
          incomingStrip.anchorDiff <= fragmentEnd

    if (anchorIsWithinFragment) {
      if (
        incomingStrip.insertionDiff < 0 &&
        // If the original removal spans farther than this fragment, materialize only this fragment's
        // remaining suffix here; anchorStrip handles any affected later original fragments.
        Math.abs(incomingStrip.insertionDiff) >
          fragmentEnd - incomingStrip.anchorDiff
      )
        // The available suffix length is negated; preserve the original immutable removal length.
        incomingStrip.fragmentDiff =
          incomingStrip.anchorDiff - fragmentEnd

      break
    }

    // If the original point is no longer in this fragment, inspect the adjacent materialization
    // for a mask owning the consumed interval before advancing to the next original fragment.
    let consumingMask = anchoringStrip.rightStep

    while (
      consumingMask &&
      // Stay within masks and siblings anchored to this original Insertion; another parent's
      // coordinate space cannot determine whether the requested point was consumed.
      consumingMask.anchorSession === origin.insertionSession &&
      consumingMask.anchorStart === origin.insertionStart &&
      // Zero-effect masks consume nothing. Positive siblings are not masks. Past mask endpoints
      // are skipped with >= for affected Frames, but > for positive right-boundary anchors.
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
      // A positive sibling is skipped through its competitor chain, not through its descendants.
      consumingMask = consumingMask.insertionDiff > 0
        ? consumingMask.rightCompetitor
        // Advance to a mask's next fragment only once the requested point reaches its start.
        // Otherwise use the next competitor or structural successor so a gap owned by another mask
        // is not skipped. Positive anchors retain the current mask at an equal boundary.
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
      // The resolved candidate must actually be a reducing Insertion anchored in the original coordinate space.
      consumingMask.insertionDiff < 0 &&
      consumingMask.anchorSession === origin.insertionSession &&
      consumingMask.anchorStart === origin.insertionStart
    ) {
      // A mask fragment offset is relative to that mask's original start; add its canonical
      // anchorDiff to express the affected interval in the parent Insertion's coordinates.
      const maskStart = consumingMask.anchorDiff + (consumingMask.fragmentStart ?? 0)
      const maskEnd = maskStart + Math.abs(consumingMask.fragmentDiff ?? consumingMask.insertionDiff)
      // Masks own affected Frames in [start,end). A positive anchor inside a consumed interval
      // uses (start,end], leaving the mask's left boundary available to same-anchor competition.
      const maskContainsAnchor =
        incomingStrip.insertionDiff < 0
          ? incomingStrip.anchorDiff >= maskStart &&
            incomingStrip.anchorDiff < maskEnd
          : incomingStrip.anchorDiff > maskStart &&
            incomingStrip.anchorDiff <= maskEnd

      // A positive Insertion at a consumed point anchors structurally within its owning mask;
      // translate only the placement coordinate, leaving the incoming canonical anchor unchanged.
      if (maskContainsAnchor && incomingStrip.insertionDiff > 0)
        return [
          incomingStrip.anchorDiff - consumingMask.anchorDiff,
          consumingMask,
        ]

      if (
        maskContainsAnchor &&
        // Consume already removed overlap here only across different removal Sessions;
        // same-Session masks retain their sequencing relation.
        consumingMask.insertionSession !== incomingStrip.insertionSession
      ) {
        // Translate the point to the owning mask's original coordinate space.
        const anchorDiff = incomingStrip.anchorDiff - consumingMask.anchorDiff
        // Clip consumed overlap to both the incoming runtime remainder and the owning mask's right end.
        const consumed = Math.min(
          Math.abs(incomingStrip.fragmentDiff ?? incomingStrip.insertionDiff),
          maskEnd - incomingStrip.anchorDiff
        )

        // Skip already consumed Frames in runtime metadata; adding the offset to the original
        // negative length leaves only the unconsumed negative effect.
        incomingStrip.fragmentStart = (incomingStrip.fragmentStart ?? 0) + consumed
        incomingStrip.fragmentDiff = incomingStrip.insertionDiff + incomingStrip.fragmentStart

        // No further visible deletion remains; retain the mask at the resolved consumed endpoint.
        if (incomingStrip.fragmentDiff === 0)
          return [anchorDiff + consumed, consumingMask]

        // Continue from the consumed endpoint in the original parent's coordinate space.
        const advancedAnchor = incomingStrip.anchorDiff + consumed
        let rightFragment = anchoringStrip.rightFragment!

        while (
          rightFragment &&
          // A right fragment ending at or before the endpoint contains no further affected Frame;
          // advance through rightFragment, without revisiting previous fragments.
          advancedAnchor >=
          (rightFragment.fragmentStart ?? 0) +
            Math.abs(
              rightFragment.fragmentDiff ?? rightFragment.insertionDiff
            )
        )
          rightFragment = rightFragment.rightFragment!

        // Without a later materialized fragment, the remaining range contributes no visible deletion.
        // Keep the canonical mask identity with a zero runtime effect.
        if (!rightFragment) {
          incomingStrip.fragmentStart = Math.abs(incomingStrip.insertionDiff)
          incomingStrip.fragmentDiff = 0
          return [anchorDiff + consumed, consumingMask]
        }

        // A removed gap may extend to the next fragment's start; begin at whichever point is farther right.
        const resolvedAnchor = Math.max(advancedAnchor, rightFragment.fragmentStart ?? 0)
        // Cap the skipped prefix at the original mask length so runtime consumption cannot exceed it.
        incomingStrip.fragmentStart = Math.min(
          -incomingStrip.insertionDiff,
          resolvedAnchor - incomingStrip.anchorDiff
        )
        incomingStrip.fragmentDiff = incomingStrip.insertionDiff + incomingStrip.fragmentStart
        return [resolvedAnchor, rightFragment]
      }
    }

    const rightFragment = anchoringStrip.rightFragment
    // The final original fragment is the last available placement candidate.
    if (!rightFragment) break

    anchoringStrip = rightFragment
  }

  // Do not resolve inside a prefix that no longer belongs to this fragment.
  const anchorDiff = Math.max(incomingStrip.anchorDiff, anchoringStrip.fragmentStart ?? 0)
  // A mask whose canonical start precedes the available fragment skips that consumed prefix
  // in runtime metadata only; positive Insertions keep their original effect.
  if (incomingStrip.insertionDiff < 0 && anchorDiff > incomingStrip.anchorDiff) {
    incomingStrip.fragmentStart = Math.min(-incomingStrip.insertionDiff, anchorDiff - incomingStrip.anchorDiff)
    incomingStrip.fragmentDiff = incomingStrip.insertionDiff + incomingStrip.fragmentStart
  }
  return [anchorDiff, anchoringStrip]
}
