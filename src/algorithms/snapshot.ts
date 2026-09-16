import type { Sequence } from '../class.js'
import type { Insertion, Snapshot, Strip } from '../types/type.js'

export function snapshot<T>(this: Sequence<T>): Snapshot<T> {
  const projection: Array<Insertion<T>> = []
  const included: Map<number, Set<number>> = new Map()

  let strip: Strip<T> = this.head

  while (strip) {
    let sequencer = included.get(strip.insertionSession)

    if (!sequencer) {
      sequencer = new Set()
      included.set(strip.insertionSession, sequencer)
    }

    if (!sequencer.has(strip.insertionTime)) {
      sequencer.add(strip.insertionTime)

      projection.push([
        strip.anchorSession,
        strip.anchorTime,
        strip.anchorFrame,
        strip.insertionSession,
        strip.insertionTime,
        strip.insertionDiff,
        strip.footage,
      ])
    }

    strip = strip.rightStep
  }

  return [this.frontierTable.getFrontiers(), projection]
}
