import type { Sequence } from '../class.js'
import type { Strip } from '../types/type.js'

export function splitStrip<T>(
  this: Sequence<T>,
  strip: NonNullable<Strip<T>>,
  offset: number
): NonNullable<Strip<T>> {
  const fragmentLength = strip.fragmentLength ?? strip.initialLength

  const suffix: NonNullable<Strip<T>> = {
    type: strip.type,
    depencyPrefix: strip.depencyPrefix + offset,
    initialLength: 0,
    offsetLength: strip.offsetLength + offset,
    actorX: strip.actorX,
    timeX: strip.timeX,
    actorY: strip.actorY,
    timeY: strip.timeY,
    footage: strip.footage,
    fragmentLength: fragmentLength - offset,
    rightFragment: strip.rightFragment,
  }

  strip.fragmentLength = offset
  strip.rightFragment = suffix

  return suffix
}
