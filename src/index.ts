import { Bytes } from '@sovereignbase/bytecodec'
import { create } from './algorithms/create.js'
import { Delta, Strip } from './types/type.js'

export class Sequencer<T> {
  public head: Strip<T> | undefined
  public gate: Strip<T> | undefined
  public tail: Strip<T> | undefined

  public readonly containmentTable: Map<number, Map<number, Strip<T>>> =
    new Map()
  public readonly actors: Set<number> = new Set()
  public readonly frontiers: Map<number, Map<number, number>> = new Map()

  //
  public readonly maskClock: [session: number, time: number] = [0, 0]
  public readonly insertClock: [actor: number, time: number] = [0, 0]
  //
  constructor(actorID: number) {
    create.call(this, actorID)
  }
}
