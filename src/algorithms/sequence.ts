import type { Projection } from '../class.js'
import type { Insertion, Sequence, Strip } from '../types/type.js'

export function sequence<T>(this: Projection<T>): Sequence<T> {
  const insertions: Array<Insertion<T>> = []
  const included: Map<string, Insertion<T>> = new Map()
  const removed: Map<string, Uint32Array> = new Map()
  const compactableIDs = new Set(
    this.frontierTable.getCompactableSessions()
  )

  let strip: Strip<T> = this.head

  while (strip) {
    const id = `${strip.insertionSession}:${strip.insertionStart}`
    let insertion = included.get(id)

    if (!insertion) {
      let anchorSession = strip.anchorSession
      let anchorStart = strip.anchorStart
      let anchorDiff = strip.anchorDiff
      const dependency = included.get(`${anchorSession}:${anchorStart}`)

      if (dependency && dependency[5] < 0) {
        anchorSession = dependency[0]
        anchorStart = dependency[1]
        anchorDiff += dependency[2]
      }

      insertion = [
        anchorSession,
        anchorStart,
        anchorDiff,
        strip.insertionSession,
        strip.insertionStart,
        strip.insertionDiff,
        strip.footage,
      ]

      included.set(id, insertion)
      insertions.push(insertion)
    }

    const diff = strip.fragmentDiff ?? strip.insertionDiff

    if (compactableIDs.has(strip.insertionSession) && diff < 0) {
      const dependency = included.get(`${insertion[0]}:${insertion[1]}`)!
      const dependencyID = `${dependency[3]}:${dependency[4]}`
      let frames = removed.get(dependencyID)

      if (!frames) {
        frames = new Uint32Array(dependency[5])
        removed.set(dependencyID, frames)
      }

      const start = insertion[2] + (strip.fragmentStart ?? 0)
      frames.fill(1, start, start - diff)
    }

    strip = strip.rightStep
  }

  for (const frames of removed.values()) {
    let count = 0

    for (let index = 0; index < frames.length; ++index) {
      count += frames[index]
      frames[index] = count
    }
  }

  const removedBefore = (frames: Uint32Array | undefined, at: number) =>
    !frames || at <= 0
      ? 0
      : (frames[Math.min(at, frames.length) - 1] ??
        frames[frames.length - 1] ??
        0)

  const projection: Array<Insertion<T>> = []
  const rewritten: Map<string, Insertion<T>> = new Map()

  for (const insertion of insertions) {
    let anchorSession = insertion[0]
    let anchorStart = insertion[1]
    let anchorDiff = insertion[2]
    const dependency = rewritten.get(`${anchorSession}:${anchorStart}`)

    if (dependency?.[5] === 0) {
      anchorSession = dependency[0]
      anchorStart = dependency[1]
      anchorDiff = dependency[2]
    } else {
      anchorDiff -= removedBefore(
        removed.get(`${anchorSession}:${anchorStart}`),
        anchorDiff
      )
    }

    let insertionDiff = insertion[5]
    let footage = insertion[6]
    const id = `${insertion[3]}:${insertion[4]}`

    if (insertionDiff > 0) {
      const frames = removed.get(id)

      if (frames) {
        const compacted: Array<T | undefined> = []

        for (let index = 0; index < insertionDiff; ++index) {
          const previous = index === 0 ? 0 : frames[index - 1]

          if (frames[index] === previous)
            compacted.push(footage?.[index])
        }

        insertionDiff = compacted.length
        footage = compacted
      }
    } else if (compactableIDs.has(insertion[3])) {
      insertionDiff = 0
    } else {
      const frames = removed.get(`${insertion[0]}:${insertion[1]}`)
      const start = insertion[2]
      const end = start - insertionDiff

      insertionDiff +=
        removedBefore(frames, end) - removedBefore(frames, start)
    }

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

    if (insertionDiff !== 0) projection.push(compacted)
  }

  const frontiers = this.frontierTable.getFrontiers().map((frontier) => {
    const acknowledgement = [frontier[0]]

    for (let index = 1; index < frontier.length; index += 2)
      if (!compactableIDs.has(frontier[index]))
        acknowledgement.push(frontier[index], frontier[index + 1])

    return acknowledgement
  })

  return [frontiers, projection]
}
