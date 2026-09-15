import type { Acknowledgement, Delta, Insertion } from '../types/type.js'

const isSafeInteger = Number.isSafeInteger

export function isInsertion<T>(data: unknown): data is Insertion<T> {
  if (!Array.isArray(data) || (data.length !== 6 && data.length !== 7))
    return false

  if (
    !isSafeInteger(data[0]) ||
    !isSafeInteger(data[1]) ||
    !isSafeInteger(data[2]) ||
    !isSafeInteger(data[3]) ||
    !isSafeInteger(data[4]) ||
    !isSafeInteger(data[5]) ||
    data[5] === 0
  )
    return false

  return data.length === 6 || data[6] === undefined || Array.isArray(data[6])
}

export function isAcknowledgement(data: unknown): data is Acknowledgement {
  if (!Array.isArray(data) || data.length < 1 || (data.length & 1) === 0)
    return false

  for (let i = 0; i < data.length; ++i)
    if (!isSafeInteger(data[i])) return false

  return true
}

export function isDelta<T>(data: unknown): data is Delta<T> {
  if (!Array.isArray(data) || data.length === 0) return false

  if (data.length === 6) return isInsertion<T>(data)

  if (data.length === 7 && (data[6] === undefined || Array.isArray(data[6])))
    return isInsertion<T>(data)

  return isAcknowledgement(data)
}
