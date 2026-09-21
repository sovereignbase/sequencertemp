import type { Strip } from '../types/type.js'
import { containsAnchor } from '../auxiliary/containsAnchor.js'

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

  let previousStrip = rootStrip
  let previousFragmentFrame = 0
  let nextStrip = previousStrip.rightStep

  while (nextStrip) {
    let ancestorStrip = previousStrip
    let ancestorFragmentFrame = previousFragmentFrame

    while (
      ancestorStrip.rightFragment !== nextStrip &&
      !containsAnchor(
        ancestorStrip,
        nextStrip,
        ancestorFragmentFrame,
        ancestorFragmentFrame +
          Math.abs(ancestorStrip.fragmentDiff ?? ancestorStrip.insertionDiff)
      )
    ) {
      const ancestor = ancestors.pop()

      if (!ancestor) return previousStrip

      ;[ancestorStrip, ancestorFragmentFrame] = ancestor
    }

    void ancestors.push([ancestorStrip, ancestorFragmentFrame])

    if (ancestorStrip.rightFragment === nextStrip) {
      previousFragmentFrame =
        ancestorFragmentFrame +
        Math.abs(ancestorStrip.fragmentDiff ?? ancestorStrip.insertionDiff)
    } else {
      previousFragmentFrame = 0
    }

    previousStrip = nextStrip
    nextStrip = nextStrip.rightStep
  }

  return previousStrip
}
