import type { Projection } from '../class.js'
import type { Insertion, Sequence, Strip } from '../types/type.js'

/**
 * Exports a Sequence with eligible removal sessions compacted.
 *
 * The exported anchors and Footage reflect compacted removals; the live
 * Strips and their canonical coordinates are unchanged.
 *
 * @param this Projection to serialize.
 * @returns Acknowledgement frontiers and retained Insertions.
 */
export function sequence<T>(this: Projection<T>): Sequence<T> {
  const compactableIDs = new Set(this.frontierTable.getCompactableSessions())
  // Prefix counts are needed only for Insertions affected by compactable masks.
  const removed: Map<string, Uint32Array> = new Map()

  // Masks follow their targets, so collect their effects before exporting those targets.
  // Without compaction, the export below is the only structural traversal.
  if (compactableIDs.size !== 0) {
    let strip = this.structuralHead
    while (strip) {
      const diff = strip.fragmentDiff ?? strip.insertionDiff
      if (diff < 0 && compactableIDs.has(strip.insertionSession)) {
        const id = `${strip.anchorSession}:${strip.anchorStart}`
        let frames = removed.get(id)
        if (!frames) {
          // Containment needs only the dependency fields; obtain the original positive length.
          const parent = this.containmentTable.get([
            strip.anchorSession,
            strip.anchorStart,
            strip.anchorDiff,
            strip.insertionSession,
            strip.insertionStart,
            strip.insertionDiff,
          ])!
          frames = new Uint32Array(parent.insertionDiff)
          removed.set(id, frames)
        }
        // Effective mask fragments consume disjoint remaining Frame intervals.
        const start = strip.anchorDiff + (strip.fragmentStart ?? 0)
        frames.fill(1, start, start - diff)
      }
      strip = strip.rightStep
    }
  }

  // Counts exclude the Frame at the logical anchor point itself.
  const removedBefore = (frames: Uint32Array | undefined, at: number) =>
    !frames || at <= 0 ? 0 : (frames[Math.min(at, frames.length) - 1] ?? 0)

  const projection: Array<Insertion<T>> = []
  // Keep the exported tuple and the last visited original fragment boundary.
  // Zero-effect parents stay indexed until their descendants are rewritten.
  const included: Map<string, [Insertion<T>, number]> = new Map()
  let left: Insertion<T> | undefined
  let leftDiff = 0
  let strip: Strip<T> = this.structuralHead

  while (strip) {
    const id = `${strip.insertionSession}:${strip.insertionStart}`
    let entry = included.get(id)
    let insertion = entry?.[0]
    if (!insertion) {
      let anchorSession = strip.anchorSession
      let anchorStart = strip.anchorStart
      let anchorDiff = strip.anchorDiff
      let insertionDiff = strip.insertionDiff
      let footage = strip.footage

      const anchorID = `${anchorSession}:${anchorStart}`
      const dependency = included.get(anchorID)
      const preceding = removedBefore(removed.get(anchorID), anchorDiff)

      if (
        insertionDiff > 0 &&
        dependency &&
        (dependency[0][5] <= 0 || anchorDiff > dependency[1] || preceding > 0)
      ) {
        // A mask or consumed point cannot be lifted without creating new competitors.
        // Anchor at the preceding retained boundary in the already resolved order.
        anchorSession = left?.[3] ?? 0
        anchorStart = left?.[4] ?? 0
        anchorDiff = leftDiff
      } else {
        // Masks keep their positive target; translate only compacted preceding Frames.
        anchorDiff -= preceding
      }

      const frames = removed.get(id)
      if (insertionDiff > 0 && frames) {
        const compacted: Array<T | undefined> = []
        let count = 0
        // Compact Footage and build its coordinate prefix in the same Frame traversal.
        // This allocates only the snapshot payload; live Footage stays in place.
        for (let index = 0; index < insertionDiff; ++index) {
          if (frames[index] === 0) compacted.push(footage?.[index])
          count += frames[index]
          frames[index] = count
        }
        insertionDiff = compacted.length
        footage = compacted
      } else if (insertionDiff < 0) {
        if (compactableIDs.has(strip.insertionSession)) insertionDiff = 0
        else {
          // Retained masks omit the part already represented by compacted target Frames.
          const target = removed.get(
            `${strip.anchorSession}:${strip.anchorStart}`
          )
          insertionDiff +=
            removedBefore(target, strip.anchorDiff - insertionDiff) -
            removedBefore(target, strip.anchorDiff)
        }
      }

      insertion = [
        anchorSession,
        anchorStart,
        anchorDiff,
        strip.insertionSession,
        strip.insertionStart,
        insertionDiff,
        footage,
      ]
      entry = [insertion, 0]
      included.set(id, entry)
      if (insertionDiff !== 0) projection.push(insertion)
    }

    entry![1] =
      (strip.fragmentStart ?? 0) +
      Math.abs(strip.fragmentDiff ?? strip.insertionDiff)

    if (insertion[5] !== 0) {
      left = insertion
      leftDiff = entry![1]
      if (strip.insertionDiff > 0)
        leftDiff -= removedBefore(removed.get(id), leftDiff)
      else {
        const target = removed.get(
          `${strip.anchorSession}:${strip.anchorStart}`
        )
        leftDiff -=
          removedBefore(target, strip.anchorDiff + leftDiff) -
          removedBefore(target, strip.anchorDiff)
      }
    }
    strip = strip.rightStep
  }

  const frontiers = this.frontierTable.getFrontiers()
  // No Session claims disappear when no Session is compactable; reuse these fresh tuples.
  if (compactableIDs.size === 0) return [frontiers, projection]

  return [
    frontiers.map((frontier) => {
      // Preserve Actor membership while dropping claims for omitted mask Sessions.
      const acknowledgement = [frontier[0]]
      for (let index = 1; index < frontier.length; index += 2)
        if (!compactableIDs.has(frontier[index]))
          acknowledgement.push(frontier[index], frontier[index + 1])
      return acknowledgement
    }),
    projection,
  ]
}
