import type { Projection } from '../class.js'
import type { Gossip } from '../types/type.js'

export function replace<T>(
  this: Projection<T>,
  withValues: Array<T>,
  startAt: number = 0,
  endWith: number = this.projectionFrameCount - 1
): Gossip<T> {
  return [
    ...this.remove(startAt, endWith),
    ...(withValues.length === 0 ? [] : this.insert(withValues, startAt)),
  ]
}
