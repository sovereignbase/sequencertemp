import type { Sequence } from '../class.js'
import type { Delta } from '../types/type.js'
import { isDelta } from '../auxiliary/isDelta.js'

export function ingest<T>(this: Sequence<T>, data: unknown): Delta<T> | void {
  if (!isDelta(data)) return
}
