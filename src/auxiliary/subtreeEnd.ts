import type { Strip } from '../types/type.js'

/**
 * Finds the last Strip belonging to one causal subtree.
 *
 * Direct right fragments remain part of the same subtree, and descendants
 * remain inside the subtree while their dependency falls within an active
 * ancestor fragment.
 *
 * @param rootStrip Root Strip of the subtree.
 * @returns Last Strip belonging to the subtree.
 */
export function subtreeEnd<T>(
  rootStrip: NonNullable<Strip<T>>
): NonNullable<Strip<T>> {
  const ancestorStrips: Array<NonNullable<Strip<T>>> = []
  const ancestorPrefixes: number[] = []

  let lastStrip = rootStrip
  let lastOriginPrefix = rootStrip.depencyPrefix
  let nextStrip = lastStrip.rightStep

  while (nextStrip) {
    let ancestorStrip = lastStrip
    let ancestorOriginPrefix = lastOriginPrefix

    while (
      ancestorStrip.rightFragment !== nextStrip &&
      (ancestorStrip.actorY !== nextStrip.actorX ||
        ancestorStrip.timeY !== nextStrip.timeX ||
        nextStrip.offsetLength <
          ancestorStrip.depencyPrefix - ancestorOriginPrefix ||
        nextStrip.offsetLength >
          ancestorStrip.depencyPrefix -
            ancestorOriginPrefix +
            (ancestorStrip.fragmentLength ?? ancestorStrip.initialLength))
    ) {
      const lastAncestorIndex = ancestorStrips.length - 1

      if (lastAncestorIndex < 0) return lastStrip

      ancestorStrip = ancestorStrips[lastAncestorIndex]
      ancestorOriginPrefix = ancestorPrefixes[lastAncestorIndex]

      ancestorStrips.pop()
      ancestorPrefixes.pop()
    }

    ancestorStrips.push(ancestorStrip)
    ancestorPrefixes.push(ancestorOriginPrefix)

    lastOriginPrefix =
      ancestorStrip.rightFragment === nextStrip
        ? ancestorOriginPrefix
        : nextStrip.depencyPrefix

    lastStrip = nextStrip
    nextStrip = lastStrip.rightStep
  }

  return lastStrip
}
