import type { Gossip, Snapshot, Result, Strip } from './types/type.js'
import { ContainmentTable } from './components/ContainmentTable/class.js'
import { FrontierTable } from './components/FrontierTable/class.js'
import { PendingTable } from './components/PendingTable/class.js'
import { apply } from './algorithms/apply.js'
import { create } from './algorithms/create.js'
import { findValue } from './algorithms/findValue.js'
import { findValues } from './algorithms/findValues.js'
import { insert } from './algorithms/insert.js'
import { merge } from './algorithms/merge.js'
import { remove } from './algorithms/remove.js'
import { replace } from './algorithms/replace.js'
import { snapshot } from './algorithms/snapshot.js'

export class Sequence<T> {
  public head: Strip<T> | undefined
  public projected: Strip<T> | undefined
  public tail: Strip<T> | undefined
  //
  public rightJumpToPatch?: Strip<T>
  public leftJumpToPatch?: Strip<T>
  //
  public structuralStripCount: number = 0
  public projectedFrameCount: number = 0
  public projectedIndex: number = 0
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
  /**
   *
   * @param at Slot number where the value you want to find is at.
   * @returns
   */
  findValue(at: number): T | undefined {
    return findValue.call(this, at) as T | undefined
  }
  /**
   *
   * @param startAt First slot you want included in the result or first slot.
   * @param endWith Last slot you want included in the result or last slot.
   * @returns
   */
  findValues(startAt?: number, endWith?: number): Array<T> {
    return findValues.call(this, startAt, endWith) as Array<T>
  }
  //
  insert(values: Array<T>, at: number): Gossip<T> {
    return insert.call(this, values, at) as Gossip<T>
  }
  //
  length(): number {
    return this.projectedFrameCount
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
}

export type * from './types/type.js'
