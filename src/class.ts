import { create } from './algorithms/create.js'
import { Delta, Snapshot, Strip } from './types/type.js'
import { FrontierTable } from './components/FrontierTable/class.js'
import { ContainmentTable } from './components/ContainmentTable/class.js'
import { find } from './algorithms/find.js'
import { insert } from './algorithms/insert.js'
import { apply } from './algorithms/apply.js'
import { PendingTable } from './components/PendingTable/class.js'

export class Sequence<T> {
  public head: Strip<T> | undefined
  public gate: Strip<T> | undefined
  public tail: Strip<T> | undefined
  //
  public rightJumpToPatch?: Strip<T>
  public leftJumpToPatch?: Strip<T>
  //
  public structuralStripCount: number = 0
  public visibleFrameCount: number = 0
  public visibleIndex: number = 0
  //
  public readonly containmentTable: ContainmentTable<T> = new ContainmentTable()
  public readonly frontierTable: FrontierTable = new FrontierTable()
  public readonly pendingtable: PendingTable<T> = new PendingTable()
  //
  public readonly increaseClock: [id: number, time: number] = [0, 0]
  public readonly decreaseClock: [id: number, time: number] = [0, 0]
  //
  apply(data: unknown): Delta<T> | undefined {
    return apply.call(this, data) as Delta<T> | undefined
  }
  //
  constructor(actorID: number, trustedSnapshot?: unknown) {
    create.call(this, actorID, trustedSnapshot)
  }
  //
  find(index: number): T | undefined {
    return find.call(this, index) as T | undefined
  }
  //
  insert(values: Array<T>, at: number) {
    return insert.call(this, values, at)
  }
  //
  merge() {}
  //
  remove() {}
  //
  replace() {}
}
