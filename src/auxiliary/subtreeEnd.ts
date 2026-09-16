import type { Strip } from '../types/type.js'

/**
 * Finds the final Strip belonging to one causal subtree.
 *
 * Descendants remain inside the subtree when their stable anchor falls within
 * an active fragment. Right fragments remain part of their original insertion
 * regardless of descendants separating them in Structural Order.
 *
 * @param rootStrip Root Strip of the subtree.
 * @returns Final Strip belonging to the subtree.
 */
export function subtreeEnd<T>(
  rootStrip: NonNullable<Strip<T>>
): NonNullable<Strip<T>> {
  const ancestors: Array<
    [strip: NonNullable<Strip<T>>, fragmentFrame: number]
  > = []

  let lastStrip = rootStrip
  let lastFragmentFrame = 0
  let nextStrip = lastStrip.rightStep

  while (nextStrip) {
    let ancestorStrip = lastStrip
    let ancestorFragmentFrame = lastFragmentFrame

    while (
      ancestorStrip.rightFragment !== nextStrip &&
      (ancestorStrip.insertionSequencer !== nextStrip.anchorSequencer ||
        ancestorStrip.insertionTime !== nextStrip.anchorTime ||
        nextStrip.anchorFrame < ancestorFragmentFrame ||
        nextStrip.anchorFrame >
          ancestorFragmentFrame +
            Math.abs(
              ancestorStrip.fragmentDiff ?? ancestorStrip.insertionDiff
            ) +
            1)
    ) {
      const ancestor = ancestors.pop()

      if (!ancestor) return lastStrip

      ancestorStrip = ancestor[0]
      ancestorFragmentFrame = ancestor[1]
    }

    ancestors.push([ancestorStrip, ancestorFragmentFrame])

    if (ancestorStrip.rightFragment === nextStrip) {
      lastFragmentFrame =
        ancestorFragmentFrame +
        Math.abs(ancestorStrip.fragmentDiff ?? ancestorStrip.insertionDiff)
    } else {
      lastFragmentFrame = 0
    }

    lastStrip = nextStrip
    nextStrip = nextStrip.rightStep
  }

  return lastStrip
}
