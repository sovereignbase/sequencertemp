import { findFrameByVisibleIndex } from '../auxiliary/findFrameByVisibleIndex.js'
import type { Sequence } from '../class.js'
import type { Strip } from '../types/type.js'

export function insert<T>(this: Sequence<T>, values: Array<T>, at: number) {
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
}
