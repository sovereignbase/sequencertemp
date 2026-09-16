import { apply } from './apply.js'
import { isSnapshot } from '../auxiliary/isSnapshot.js'
import type { Sequence } from '../class.js'
import type { Result } from '../types/type.js'

export function merge<T>(
  this: Sequence<T>,
  data: unknown
): Result<T> | undefined {
  if (!isSnapshot<T>(data)) return

  const [frontiers, projection] = data

  const result = apply.call(this, projection) as Result<T> | undefined

  void apply.call(this, frontiers)

  return result
}
