import type { Insertion, Strip } from '../../types/type.js'

export class PendingTable<T> {
  private readonly insertions: Map<number, Map<number, Array<Insertion<T>>>> =
    new Map()

  set(incoming: Insertion<T>): void {
    let sequencer = this.insertions.get(incoming[0])

    if (!sequencer) {
      sequencer = new Map()
      this.insertions.set(incoming[0], sequencer)
    }

    let pending = sequencer.get(incoming[1])

    if (!pending) {
      pending = []
      sequencer.set(incoming[1], pending)
    }

    pending.push(incoming)
  }

  take(incomingStrip: NonNullable<Strip<T>>): Array<Insertion<T>> | undefined {
    const sequencer = this.insertions.get(incomingStrip.insertionSession)
    if (!sequencer) return

    const pending = sequencer.get(incomingStrip.insertionStart)
    if (!pending) return

    sequencer.delete(incomingStrip.insertionStart)

    if (sequencer.size === 0)
      this.insertions.delete(incomingStrip.insertionSession)

    return pending
  }
}
