import { apply } from './apply.js'
import { isSequence } from '../auxiliary/isSequence.js'
import type { Projection } from '../class.js'
import type { Result } from '../types/type.js'

export function merge<T>(
  this: Projection<T>,
  sequence: unknown
): Result<T> | undefined {
  if (!isSequence<T>(sequence)) return

  const [frontiers, projection] = sequence

  const result = apply.call(this, projection) as Result<T> | undefined

  void apply.call(this, frontiers)

  return result
}
