import { create } from './algorithms/create.js'
import { Gossip, Snapshot, Result, Strip } from './types/type.js'
import { FrontierTable } from './components/FrontierTable/class.js'
import { ContainmentTable } from './components/ContainmentTable/class.js'
import { find } from './algorithms/find.js'
import { insert } from './algorithms/insert.js'
import { apply } from './algorithms/apply.js'
import { PendingTable } from './components/PendingTable/class.js'
import { merge } from './algorithms/merge.js'
import { remove } from './algorithms/remove.js'
import { replace } from './algorithms/replace.js'
import { values } from './algorithms/values.js'
import { snapshot } from './algorithms/snapshot.js'

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
  public readonly pendingTable: PendingTable<T> = new PendingTable()
  //
  public readonly increaseClock: [id: number, time: number] = [0, 0]
  public readonly decreaseClock: [id: number, time: number] = [0, 0]
  //
  apply(data: unknown): Result<T> | undefined {
    return apply.call(this, data) as Result<T> | undefined
  }
  //
  constructor(
    public readonly actorID: number,
    trustedSnapshot?: unknown
  ) {
    void create.call(this, trustedSnapshot)
  }
  //
  find(index: number): T | undefined {
    return find.call(this, index) as T | undefined
  }
  //
  insert(values: Array<T>, at: number): Gossip<T> {
    return insert.call(this, values, at) as Gossip<T>
  }
  //
  length(): number {
    return this.visibleFrameCount
  }
  //
  merge(data: unknown): Result<T> | undefined {
    return merge.call(this, data) as Result<T> | undefined
  }
  //
  remove(startAt?: number, endAt?: number): Gossip<T> {
    return remove.call(this, startAt, endAt) as Gossip<T>
  }
  //
  replace(withValues: Array<T>, startAt?: number, endAt?: number): Gossip<T> {
    return replace.call(this, withValues, startAt, endAt) as Gossip<T>
  }
  //
  snapshot(): Snapshot<T> {
    return snapshot.call(this) as Snapshot<T>
  }
  //
  values(startAt?: number, endAt?: number): Array<T> {
    return values.call(this, startAt, endAt) as Array<T>
  }
}

export type * from './types/type.js'
