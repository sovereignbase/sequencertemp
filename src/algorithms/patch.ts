import { Sequence } from '../class.js'
import type { Delta, Strip } from '../types/type.js'

export function patch<T>(this: Sequence<T>, delta: Delta<T>): void {
  if (this.containmentTable.has(delta)) return
  let containingStrip: Strip<T> = this.containmentTable.get(delta)
  if (!containingStrip) return

  const [
    type,
    depencyPrefix,
    initialLength,
    offsetLength,
    actorX,
    timeX,
    actorY,
    timeY,
    footage,
  ] = delta

  const incomingStrip: Strip<T> = {
    type,
    depencyPrefix,
    initialLength,
    offsetLength,
    actorX,
    timeX,
    actorY,
    timeY,
    footage,
  }

  if (offsetLength > incomingStrip.initialLength) return

  if (containingStrip.fragmentLength) {
    let framePosition: number = containingStrip.fragmentLength

    while (framePosition < offsetLength) {
      if (!containingStrip.rightFragment) return
      containingStrip = containingStrip.rightFragment
      framePosition += containingStrip.fragmentLength!
    }
  }

  const prefix: Strip<T> = containingStrip
  const middle: Strip<T> = incomingStrip
  let suffix: Strip<T>
}
