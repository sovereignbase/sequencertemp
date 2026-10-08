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
  // Export tuples once per canonical identity while inspecting every runtime fragment.
  const insertions: Array<Insertion<T>> = []
  const included: Map<string, Insertion<T>> = new Map()
  // Per-original-Insertion Frame markers combine compactable masks without double counting.
  const removed: Map<string, Uint32Array> = new Map()
  // Use the frontier table's consensus result; this path does not verify missing mask payloads.
  const compactableIDs = new Set(
    this.frontierTable.getCompactableSessions()
  )

  // Include hidden history as well as visible Frames; head alone would lose masks and dependencies.
  let strip: Strip<T> = this.structuralHead

  while (strip) {
    // All fragments of one Insertion share this identity, independent of their runtime offsets.
    const id = `${strip.insertionSession}:${strip.insertionStart}`
    let insertion = included.get(id)

    // Only the first encountered fragment emits the original canonical tuple.
    if (!insertion) {
      let anchorSession = strip.anchorSession
      let anchorStart = strip.anchorStart
      let anchorDiff = strip.anchorDiff
      const dependency = included.get(`${anchorSession}:${anchorStart}`)

      // Translate an anchor on a mask into that mask's parent coordinate space for the export.
      if (dependency && dependency[5] < 0) {
        anchorSession = dependency[0]
        anchorStart = dependency[1]
        // The mask's original anchor offset locates its coordinate origin in its parent.
        anchorDiff += dependency[2]
      }

      insertion = [
        anchorSession,
        anchorStart,
        anchorDiff,
        strip.insertionSession,
        strip.insertionStart,
        strip.insertionDiff,
        // Initially reuse the Footage reference; only compacted export payloads allocate a replacement.
        strip.footage,
      ]

      included.set(id, insertion)
      insertions.push(insertion)
    }

    const diff = strip.fragmentDiff ?? strip.insertionDiff

    // Mark only the still-effective fragments of removal Sessions eligible for compaction.
    if (compactableIDs.has(strip.insertionSession) && diff < 0) {
      // Compaction requires the mask target to have been included earlier in structural order.
      const dependency = included.get(`${insertion[0]}:${insertion[1]}`)!
      const dependencyID = `${dependency[3]}:${dependency[4]}`
      let frames = removed.get(dependencyID)

      // Allocate markers once for the targeted original positive Insertion's Frame count.
      if (!frames) {
        frames = new Uint32Array(dependency[5])
        removed.set(dependencyID, frames)
      }

      // A mask fragment's own offset plus its canonical anchor gives the affected original Frame.
      const start = insertion[2] + (strip.fragmentStart ?? 0)
      // Mark the half-open consumed interval. Assignment to 1 unions overlapping masks.
      frames.fill(1, start, start - diff)
    }

    strip = strip.rightStep
  }

  // Convert union markers into prefix counts so later anchor translations need constant-time queries.
  for (const frames of removed.values()) {
    let count = 0

    for (let index = 0; index < frames.length; ++index) {
      // The running count includes this Frame; the previous entry counts only earlier Frames.
      count += frames[index]
      frames[index] = count
    }
  }

  // An anchor at zero has no preceding Frames. At N, use entry N-1 so only Frames
  // strictly before the logical point count; points beyond the array use the total.
  const removedBefore = (frames: Uint32Array | undefined, at: number) =>
    !frames || at <= 0
      ? 0
      : (frames[Math.min(at, frames.length) - 1] ??
        frames[frames.length - 1] ??
        0)

  const projection: Array<Insertion<T>> = []
  // Keep rewritten zero-effect parents too, because retained descendants may still anchor to them.
  const rewritten: Map<string, Insertion<T>> = new Map()

  for (const insertion of insertions) {
    let anchorSession = insertion[0]
    let anchorStart = insertion[1]
    let anchorDiff = insertion[2]
    const dependency = rewritten.get(`${anchorSession}:${anchorStart}`)

    // An omitted parent has no exported coordinate span; attach its child at the parent's rewritten anchor.
    if (dependency?.[5] === 0) {
      anchorSession = dependency[0]
      anchorStart = dependency[1]
      anchorDiff = dependency[2]
    } else {
      // For a retained parent, subtract only compacted Frames preceding the child's anchor.
      anchorDiff -= removedBefore(
        removed.get(`${anchorSession}:${anchorStart}`),
        anchorDiff
      )
    }

    let insertionDiff = insertion[5]
    let footage = insertion[6]
    const id = `${insertion[3]}:${insertion[4]}`

    // Positive payloads retain their original reference unless marked Frames must be omitted.
    if (insertionDiff > 0) {
      const frames = removed.get(id)

      // Build compacted Footage for this snapshot only; do not resize or replace the live Strip's array.
      if (frames) {
        const compacted: Array<T | undefined> = []

        for (let index = 0; index < insertionDiff; ++index) {
          // The prefix count before Frame zero is zero; later Frames use the previous prefix entry.
          const previous = index === 0 ? 0 : frames[index - 1]

          // An unchanged prefix means this Frame was not marked, so its value survives compaction.
          if (frames[index] === previous)
            compacted.push(footage?.[index])
        }

        // The exported positive length must equal the compacted Frame count.
        insertionDiff = compacted.length
        footage = compacted
      }
    // This mask's effect is already represented by omitted target Frames; omit the mask itself.
    } else if (compactableIDs.has(insertion[3])) {
      insertionDiff = 0
    } else {
      const frames = removed.get(`${insertion[0]}:${insertion[1]}`)
      const start = insertion[2]
      const end = start - insertionDiff

      // For a noncompactable mask, subtract the part already represented by compacted removals.
      // Adding that nonnegative overlap brings its negative effect toward zero.
      insertionDiff +=
        removedBefore(frames, end) - removedBefore(frames, start)
    }

    // Rewrite export coordinates and effect while preserving the Insertion's own identity.
    const compacted: Insertion<T> = [
      anchorSession,
      anchorStart,
      anchorDiff,
      insertion[3],
      insertion[4],
      insertionDiff,
      footage,
    ]

    rewritten.set(id, compacted)

    // Zero-effect tuples cannot pass the Insertion guard and are unnecessary in the exported graph.
    if (insertionDiff !== 0) projection.push(compacted)
  }

  const frontiers = this.frontierTable.getFrontiers().map((frontier) => {
    // Preserve Actor membership even when every Session pair is removed.
    const acknowledgement = [frontier[0]]

    for (let index = 1; index < frontier.length; index += 2)
      // Drop frontier pairs for masks omitted from this snapshot; retain other Session claims.
      if (!compactableIDs.has(frontier[index]))
        acknowledgement.push(frontier[index], frontier[index + 1])

    return acknowledgement
  })

  // Serialize frontiers separately from dependency-ordered retained Insertions.
  return [frontiers, projection]
}
