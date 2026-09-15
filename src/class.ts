import { create } from './algorithms/create.js'
import { Delta, Snapshot, Strip } from './types/type.js'
import { FrontierTable } from './components/FrontierTable/class.js'
import { ContainmentTable } from './components/ContainmentTable/class.js'
import { patch } from './algorithms/patch.js'
import { read } from './algorithms/read.js'
import { insert } from './algorithms/insert.js'

export class Sequence<T> {
  public head: Strip<T> | undefined
  public gate: Strip<T> | undefined
  public tail: Strip<T> | undefined
  //
  rightJumpToPatch?: Strip<T>
  leftJumpToPatch?: Strip<T>
  //
  public structuralStripCount: number = 0
  public visibleFrameCount: number = 0
  public visibleIndex: number = 0
  //
  public readonly containmentTable: ContainmentTable<T> = new ContainmentTable()
  public readonly frontierTable: FrontierTable = new FrontierTable()
  //

  //
  public readonly maskClock: [session: number, time: number] = [0, 0]
  public readonly insertClock: [actor: number, time: number] = [0, 0]
  //
  constructor(actorID: number, trustedSnapshot?: unknown) {
    create.call(this, actorID, trustedSnapshot)
  }
  insert(values: Array<T>, at: number) {
    return insert.call(this, values, at)
  }
  //
  patch(delta: Delta<T>) {
    patch.call(this, delta)
  }
  read(index: number): T | undefined {
    return read.call(this, index) as T | undefined
  }
}
