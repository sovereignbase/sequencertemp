import type { Gossip, Sequence, Result, Strip } from './types/type.js'
import { ContainmentTable } from './components/ContainmentTable/class.js'
import { FrontierTable } from './components/FrontierTable/class.js'
import { PendingTable } from './components/PendingTable/class.js'
import { apply } from './algorithms/apply.js'
import { create } from './algorithms/create.js'
import { value } from './algorithms/value.js'
import { values } from './algorithms/values.js'
import { insert } from './algorithms/insert.js'
import { merge } from './algorithms/merge.js'
import { remove } from './algorithms/remove.js'
import { replace } from './algorithms/replace.js'
import { sequence } from './algorithms/sequence.js'

export class Projection<T> {
  /** Strip containing the very left-most position of the projection (0) */
  public head: Strip<T> | undefined
  /** Strip containing the currently projected position of the projection */
  public gate: Strip<T> | undefined
  /** Strip containing the very right-most position of the projection (projectionFrameCount - 1) */
  public tail: Strip<T> | undefined
  //
  public rightJumpToPatch?: Strip<T>
  public leftJumpToPatch?: Strip<T>
  //
  /**Strucural amount of strips in the sequence. */
  public structuralStripCount: number = 0
  /** Amount of frames in the projection. */
  public projectionFrameCount: number = 0
  /** Zero-based projection position of the strip currently projected at gate. */
  public projectedPosition: number = 0
  //
  public readonly containmentTable: ContainmentTable<T> = new ContainmentTable()
  public readonly frontierTable: FrontierTable = new FrontierTable()
  public readonly pendingTable: PendingTable<T> = new PendingTable()
  //
  public readonly increaseClock: [id: number, time: number] = [0, 0]
  public readonly decreaseClock: [id: number, time: number] = [0, 0]
  //
  apply(gossip: unknown): Result<T> | undefined {
    return apply.call(this, gossip) as Result<T> | undefined
  }
  //
  constructor(
    public readonly actorID: number,
    trustedSequence?: unknown
  ) {
    void create.call(this, trustedSequence)
  }
  /**
   *
   * @param values Values you want to insert.
   * @param at Position where you vant the values to be inserted.
   * @returns
   */
  insert(values: Array<T>, at: number): Gossip<T> {
    return insert.call(this, values, at) as Gossip<T>
  }
  //
  length(): number {
    return this.projectionFrameCount
  }
  //
  merge(sequence: unknown): Result<T> | undefined {
    return merge.call(this, sequence) as Result<T> | undefined
  }
  /**
   *
   * @param startAt First position you want removed.
   * @param endWith Last position you want removed.
   * @returns
   */
  remove(startAt?: number, endWith?: number): Gossip<T> {
    return remove.call(this, startAt, endWith) as Gossip<T>
  }
  /**
   *
   * @param withValues Values you want the positions to be replaced with.
   * @param startAt First position you want replaced.
   * @param endWith Last position you want replaced.
   * @returns
   */
  replace(withValues: Array<T>, startAt?: number, endWith?: number): Gossip<T> {
    return replace.call(this, withValues, startAt, endWith) as Gossip<T>
  }
  //
  sequence(): Sequence<T> {
    return sequence.call(this) as Sequence<T>
  }
  /**
   *
   * @param at Projection position where the value you want is.
   * @returns
   */
  value(at: number): T | undefined {
    return value.call(this, at) as T | undefined
  }
  /**
   *
   * @param startAt First projection position you want included in the result or first position.
   * @param endWith Last projection position you want included in the result or last position.
   * @returns
   */
  values(startAt?: number, endWith?: number): Array<T> {
    return values.call(this, startAt, endWith) as Array<T>
  }
}

export type * from './types/type.js'
