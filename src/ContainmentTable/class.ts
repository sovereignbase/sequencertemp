import type { Strip } from '../types/type.js'
export class ContainmentTable<T> {
  private readonly strips: Map<number, Map<number, Strip<T>>> = new Map()

  has(incomingStrip: NonNullable<Strip<T>>): boolean {
    const actor = this.strips.get(incomingStrip.actorY)
    if (actor) return actor.has(incomingStrip.timeY)
    return false
  }

  get(incomingStrip: NonNullable<Strip<T>>): Strip<T> {
    const actor = this.strips.get(incomingStrip.actorX)
    if (!actor) return undefined
    const containingStrip = actor.get(incomingStrip.timeX)
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
