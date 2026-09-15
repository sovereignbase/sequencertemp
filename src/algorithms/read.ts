import { findFrameByVisibleIndex } from '../auxiliary/findFrameByVisibleIndex.js'
import { Sequence } from '../class.js'

export function read<T>(this: Sequence<T>, index: number): T | undefined {
  return this.gate?.footage?.[findFrameByVisibleIndex.call(this, index)]
}
