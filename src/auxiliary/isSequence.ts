import { isAcknowledgement, isInsertion } from './isGossip.js'
import type { Sequence } from '../types/type.js'

export function isSequence<T>(data: unknown): data is Sequence<T> {
  if (!Array.isArray(data) || data.length !== 2) return false

  const frontiers = data[0]
  const projection = data[1]

  if (!Array.isArray(frontiers) || !Array.isArray(projection)) return false

  for (let i = 0; i < frontiers.length; ++i)
    if (!isAcknowledgement(frontiers[i])) return false

  for (let i = 0; i < projection.length; ++i)
    if (!isInsertion<T>(projection[i])) return false

  return true
}
