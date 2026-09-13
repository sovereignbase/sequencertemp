import { Bytes } from '@sovereignbase/bytecodec'
import { create } from './algorithms/create.js'
import { Delta, Strip } from './types/type.js'
import { FrontierTable } from './FrontierTable/class.js'

export class Sequencer<T> {
  public head: Strip<T> | undefined
  public gate: Strip<T> | undefined
  public tail: Strip<T> | undefined

  public readonly containmentTable: Map<number, Map<number, Strip<T>>> =
    new Map()
  public readonly frontierTable: FrontierTable = new FrontierTable()

  //
  public readonly maskClock: [session: number, time: number] = [0, 0]
  public readonly insertClock: [actor: number, time: number] = [0, 0]
  //
  constructor(actorID: number) {
    create.call(this, actorID)
  }
}
