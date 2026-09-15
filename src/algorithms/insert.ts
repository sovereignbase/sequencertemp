import { findFrameByVisibleIndex } from '../auxiliary/findFrameByVisibleIndex.js'
import { insertAfter } from '../auxiliary/insertAfter.js'
import { insertBefore } from '../auxiliary/insertBefore.js'
import { insertFirst } from '../auxiliary/insertFirst.js'
import { splitStrip } from '../auxiliary/splitStrip.js'
import type { Sequence } from '../class.js'
import type { Delta, Strip } from '../types/type.js'

export function insert<T>(
  this: Sequence<T>,
  values: Array<T>,
  at: number
): Delta<T> {
  const depencyPrefix = this.insertClock[1]
  this.insertClock[1] += values.length + 1
  const offset = findFrameByVisibleIndex.call(this, at)
  const strip: Strip<T> = {
    type: 1,
    depencyPrefix,
    offsetLength: offset,
    initialLength: values.length,
    footage: values,
    actorX: this.gate!.leftStep!.actorY,
    timeX: this.gate!.leftStep!.timeX,
    actorY: this.insertClock[0],
    timeY: this.insertClock[1],
  }

  if (this.structuralStripCount === 0) insertFirst.call(this, strip)
  else if (offset === 1)
    // the visible index that should move right from under aka the index after end of a strip uses boundary marker
    insertBefore.call(this, strip, this.gate)
  else insertAfter.call(this, strip, this.gate, offset)
}
