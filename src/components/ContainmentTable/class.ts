import type { Insertion, Strip } from '../../types/type.js'

export class ContainmentTable<T> {
  private readonly strips: Map<number, Map<number, Strip<T>>> = new Map()

  has(incomingInsertion: Insertion<T>): boolean {
    const sequencer = this.strips.get(incomingInsertion[3])
    if (sequencer) return sequencer.has(incomingInsertion[4])
    return false
  }

  isRightFragment(strip: NonNullable<Strip<T>>): boolean {
    const origin = this.strips
      .get(strip.insertionSession)
      ?.get(strip.insertionStart)

    return origin !== undefined && origin !== strip
  }

  get(incomingInsertion: Insertion<T>): Strip<T> {
    const sequencer = this.strips.get(incomingInsertion[0])
    if (!sequencer) return undefined

    return sequencer.get(incomingInsertion[1])
  }

  set(incomingStrip: NonNullable<Strip<T>>): void {
    const sequencer =
      this.strips.get(incomingStrip.insertionSession) ?? new Map()

    if (sequencer.size === 0)
      void this.strips.set(incomingStrip.insertionSession, sequencer)

    void sequencer.set(incomingStrip.insertionStart, incomingStrip)
  }
}
