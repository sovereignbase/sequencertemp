import type { Strip, Delta } from '../types/type.js'
export class ContainmentTable<T> {
  private readonly strips: Map<number, Map<number, Strip<T>>> = new Map()

  has(incomingDelta: Delta<T>): boolean {
    const actor = this.strips.get(incomingDelta[6])
    if (actor) return actor.has(incomingDelta[7])
    return false
  }

  get(incomingDelta: Delta<T>): Strip<T> {
    const actor = this.strips.get(incomingDelta[4])
    if (!actor) return undefined
    const containingStrip = actor.get(incomingDelta[5])
    return containingStrip
  }

  set(incomingStrip: NonNullable<Strip<T>>): void {
    const actor: Map<number, Strip<T>> = this.strips.get(
      incomingStrip.actorY
    ) ?? new Map()
    if (actor.size === 0) void this.strips.set(incomingStrip.actorY, actor)
    void actor.set(incomingStrip.timeY, incomingStrip)
  }
}
