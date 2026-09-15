import type { Sequence } from '../class.js'
import type { Delta } from '../types/type.js'
import {
  isAcknowledgement,
  isDelta,
  isInsertion,
} from '../auxiliary/isDelta.js'

export function ingest<T>(this: Sequence<T>, data: unknown): Delta<T> | void {
  if (isInsertion(data)) {
  }
  if (isAcknowledgement(data)) {
    return void this.frontierTable.observeAcknowledgement(data)
  }
  return
}
