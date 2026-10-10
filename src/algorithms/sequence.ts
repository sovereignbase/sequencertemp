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
  // Fully removed Insertions need only their length; partial removals need Frame prefixes.
  const removed: Map<number, Map<number, Uint32Array | number>> = new Map()
  const removedFrames = (session: number, start: number) =>
    removed.get(session)?.get(start)

  // Masks follow their targets, so collect their effects before exporting those targets.
  // Without compaction, the export below is the only structural traversal.
  if (compactableIDs.size !== 0) {
    let strip = this.structuralHead
    while (strip) {
      const diff = strip.fragmentDiff ?? strip.insertionDiff
      if (diff < 0 && compactableIDs.has(strip.insertionSession)) {
        const start = strip.anchorDiff + (strip.fragmentStart ?? 0)
        let session = removed.get(strip.anchorSession)
        let frames = session?.get(strip.anchorStart)
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
          frames =
            start === 0 && -diff === parent.insertionDiff
              ? parent.insertionDiff
              : new Uint32Array(parent.insertionDiff)
          if (!session) {
            session = new Map()
            removed.set(strip.anchorSession, session)
          }
          session.set(strip.anchorStart, frames)
        }
        // Effective mask fragments consume disjoint remaining Frame intervals.
        if (typeof frames !== 'number') frames.fill(1, start, start - diff)
      }
      strip = strip.rightStep
    }
  }

  // Counts exclude the Frame at the logical anchor point itself.
  const removedBefore = (
    frames: Uint32Array | number | undefined,
    at: number
  ) =>
    !frames || at <= 0
      ? 0
      : typeof frames === 'number'
        ? Math.min(at, frames)
        : (frames[Math.min(at, frames.length) - 1] ?? 0)

  const projection: Array<Insertion<T>> = []
  // Omitted identities still deduplicate their fragments without allocating export tuples.
  const omitted: Insertion<T> = [0, 0, 0, 0, 0, 0]
  // Fragments retain one canonical identity and emit only one tuple.
  const included: Map<number, Map<number, Insertion<T>>> = new Map()
  let left: Insertion<T> | undefined
  let leftDiff = 0
  let masked = removed.size !== 0
  let strip: Strip<T> = this.structuralHead

  while (strip) {
    masked ||= strip.insertionDiff < 0
    // Omitted masks and wholly compacted parents need no export identity or tuple.
    // Their children use the preceding retained boundary rather than the omitted parent.
    if (strip.insertionDiff < 0 && compactableIDs.has(strip.insertionSession)) {
      strip = strip.rightStep
      continue
    }
    const frames =
      removed.size === 0
        ? undefined
        : removedFrames(strip.insertionSession, strip.insertionStart)
    if (typeof frames === 'number') {
      strip = strip.rightStep
      continue
    }
    let session = included.get(strip.insertionSession)
    let insertion = session?.get(strip.insertionStart)
    const first = !insertion
    if (!insertion) {
      let anchorSession = strip.anchorSession
      let anchorStart = strip.anchorStart
      let anchorDiff = strip.anchorDiff
      let insertionDiff = strip.insertionDiff
      let footage = strip.footage

      if (insertionDiff > 0 && masked) {
        // A mask or consumed point cannot be lifted without creating new competitors.
        // Anchor at the preceding retained boundary in the already resolved order.
        anchorSession = left?.[3] ?? 0
        anchorStart = left?.[4] ?? 0
        anchorDiff = leftDiff
      } else if (insertionDiff < 0 && removed.size !== 0) {
        // Masks keep their positive target; translate only compacted preceding Frames.
        anchorDiff -= removedBefore(
          removedFrames(anchorSession, anchorStart),
          anchorDiff
        )
      }

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
      } else if (insertionDiff < 0 && removed.size !== 0) {
        // Retained masks omit the part already represented by compacted target Frames.
        const target = removedFrames(strip.anchorSession, strip.anchorStart)
        insertionDiff +=
          removedBefore(target, strip.anchorDiff - insertionDiff) -
          removedBefore(target, strip.anchorDiff)
      }

      insertion =
        insertionDiff === 0
          ? omitted
          : [
              anchorSession,
              anchorStart,
              anchorDiff,
              strip.insertionSession,
              strip.insertionStart,
              insertionDiff,
              footage,
            ]
      if (!session) {
        session = new Map()
        included.set(strip.insertionSession, session)
      }
      session.set(strip.insertionStart, insertion)
      if (insertionDiff !== 0) projection.push(insertion)
    }

    // A repeated empty fragment has no fresh boundary; its point may already
    // contain the preceding child. Keep that child's free endpoint instead.
    if (
      insertion[5] !== 0 &&
      (first || (strip.fragmentDiff ?? strip.insertionDiff) !== 0)
    ) {
      left = insertion
      leftDiff =
        (strip.fragmentStart ?? 0) +
        Math.abs(strip.fragmentDiff ?? strip.insertionDiff)
      if (removed.size !== 0 && strip.insertionDiff > 0)
        leftDiff -= removedBefore(frames, leftDiff)
      else if (removed.size !== 0) {
        const target = removedFrames(strip.anchorSession, strip.anchorStart)
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
