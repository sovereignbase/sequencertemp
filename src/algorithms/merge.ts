import { apply } from './apply.js'
import { isSnapshot } from '../auxiliary/isSnapshot.js'
import type { Sequence } from '../class.js'
import type { Delta } from '../types/type.js'

export function merge<T>(
  this: Sequence<T>,
  data: unknown
): Delta<T> | undefined {
  if (!isSnapshot<T>(data)) return

  const [frontiers, projection] = data

  const delta = apply.call(this, projection) as Delta<T> | undefined

  void apply.call(this, frontiers)

  return delta
}
