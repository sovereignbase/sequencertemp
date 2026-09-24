import type { Projection } from '../class.js'
import type { Insertion, Sequence, Strip } from '../types/type.js'

export function sequence<T>(this: Projection<T>): Sequence<T> {
  const projection: Array<Insertion<T>> = []
  const included: Map<number, Set<number>> = new Map()

  let strip: Strip<T> = this.head

  while (strip) {
    let sequencer = included.get(strip.insertionSession)

    if (!sequencer) {
      sequencer = new Set()
      included.set(strip.insertionSession, sequencer)
    }

    if (!sequencer.has(strip.insertionStart)) {
      sequencer.add(strip.insertionStart)

      projection.push([
        strip.anchorSession,
        strip.anchorStart,
        strip.anchorDiff,
        strip.insertionSession,
        strip.insertionStart,
        strip.insertionDiff,
        strip.footage,
      ])
    }

    strip = strip.rightStep
  }

  return [this.frontierTable.getFrontiers(), projection]
}
