import type { Strip } from '../types/type.js'
import { containsAnchor } from '../auxiliary/containsAnchor.js'

/**
 * Finds the final Strip belonging to one causal subtree.
 *
 * Traversal proceeds through Structural Order while maintaining the active
 * ancestor chain of the subtree.
 *
 * A following Strip remains inside the subtree when either:
 *
 * - it is the `rightFragment` of an active ancestor Strip; or
 * - its stable anchor is contained within the active Frame range of an
 *   ancestor Strip.
 *
 * Right fragments remain part of their originating insertion even when other
 * descendants appear between the fragments in Structural Order. Their position
 * within that insertion is tracked through `fragmentFrame`, which identifies
 * the stable Frame at which the current fragment begins.
 *
 * When the next Strip does not belong to the current ancestor, previously
 * active ancestors are popped until a containing ancestor is found. If no
 * ancestor contains the next Strip, the subtree has ended and the previously
 * visited Strip is returned.
 *
 * @param rootStrip Root Strip of the subtree.
 * @returns Final Strip belonging to the subtree.
 */
export function subtreeEnd<T>(
  rootStrip: NonNullable<Strip<T>>
): NonNullable<Strip<T>> {
  // Active ancestor chain. `fragmentFrame` identifies the first stable Frame
  // of the ancestor's current fragment within its originating insertion.
  const ancestors: Array<
    [strip: NonNullable<Strip<T>>, fragmentFrame: number]
  > = []

  // Begin traversal from the subtree root. An originating Strip starts at
  // stable Frame zero within its insertion.
  let previousStrip = rootStrip
  let previousFragmentFrame = 0
  let nextStrip = previousStrip.rightStep

  while (nextStrip) {
    // First attempt to interpret the next Strip as belonging under the
    // previously visited Strip.
    let ancestorStrip = previousStrip
    let ancestorFragmentFrame = previousFragmentFrame

    // While the next Strip is neither the right fragment of the candidate
    // ancestor nor anchored within that ancestor's active fragment, walk back
    // through the ancestor chain.
    while (
      ancestorStrip.rightFragment !== nextStrip &&
      !containsAnchor(
        ancestorStrip,
        nextStrip,
        ancestorFragmentFrame,
        ancestorFragmentFrame +
          Math.abs(ancestorStrip.fragmentDiff ?? ancestorStrip.insertionDiff) +
          1
      )
    ) {
      // Try an earlier active ancestor.
      const ancestor = ancestors.pop()

      // No active ancestor contains the next Strip, so the subtree ends at the
      // previously visited Strip.
      if (!ancestor) return previousStrip

      ;[ancestorStrip, ancestorFragmentFrame] = ancestor
    }

    // The resolved ancestor remains active while traversing the next Strip and
    // anything structurally nested beneath it.
    void ancestors.push([ancestorStrip, ancestorFragmentFrame])

    if (ancestorStrip.rightFragment === nextStrip) {
      // A right fragment continues the same originating insertion. Advance its
      // stable fragment start by the length of the preceding fragment.
      previousFragmentFrame =
        ancestorFragmentFrame +
        Math.abs(ancestorStrip.fragmentDiff ?? ancestorStrip.insertionDiff)
    } else {
      // A descendant starts from Frame zero of its own originating insertion.
      previousFragmentFrame = 0
    }

    previousStrip = nextStrip
    nextStrip = nextStrip.rightStep
  }

  // Reaching Structural Order end (tail) without leaving the subtree means the final
  // visited Strip is also the subtree end.
  return previousStrip
}
