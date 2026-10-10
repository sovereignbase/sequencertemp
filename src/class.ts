import type { Gossip, Sequence, Result, Strip } from './types/type.js'
import { ContainmentTable } from './components/ContainmentTable/class.js'
import { FrontierTable } from './components/FrontierTable/class.js'
import { PendingTable } from './components/PendingTable/class.js'
import { apply } from './algorithms/apply.js'
import { create } from './algorithms/create.js'
import { insert } from './algorithms/insert.js'
import { merge } from './algorithms/merge.js'
import { remove } from './algorithms/remove.js'
import { replace } from './algorithms/replace.js'
import { sequence } from './algorithms/sequence.js'
import { value } from './algorithms/value.js'
import { values } from './algorithms/values.js'

/** Visible Projection of a replicated Sequence. */
export class Projection<T> {
  /** Strip containing the very left-most position of the projection (0) */
  public head: Strip<T> | undefined
  /** Local traversal Strip, retained across remote edits while its content survives. */
  public gate: Strip<T> | undefined
  /** Strip containing the very right-most position of the projection (projectionFrameCount - 1) */
  public tail: Strip<T> | undefined
  //
  /** Right endpoint of the jump awaiting a local edit's distance update. */
  public rightJumpToPatch?: Strip<T>
  /** Left endpoint of the jump awaiting a local edit's distance update. */
  public leftJumpToPatch?: Strip<T>
  //
  /** First Strip in Structural Order, including non-visible Strips. */
  public structuralHead: Strip<T> | undefined
  /** Structural amount of strips in the sequence. */
  public structuralStripCount: number = 0
  /** Amount of frames in the projection. */
  public projectionFrameCount: number = 0
  /** Cached Projection position, following the local gate across remote updates. */
  public projectedPosition: number = 0
  /** First Projection position of the Strip at gate. */
  public gatePosition: number = 0
  //
  /** Materialized Insertions indexed by their canonical identity. */
  public readonly containmentTable: ContainmentTable<T> = new ContainmentTable()
  /** Known Actor acknowledgement frontiers used for compaction. */
  public readonly frontierTable: FrontierTable = new FrontierTable()
  /** Insertions awaiting their anchoring Insertion. */
  public readonly pendingTable: PendingTable<T> = new PendingTable()
  //
  /** Session identifier and next logical time for positive Insertions. */
  public readonly increaseClock: [id: number, time: number] = [0, 0]
  /** Session identifier and next logical time for reducing Insertions. */
  public readonly decreaseClock: [id: number, time: number] = [0, 0]
  /**
   * Applies gossiped Insertions and Acknowledgements.
   *
   * @param gossip Batch of Insertion and Acknowledgement tuples.
   * @returns Visible changes and optional acknowledgement Gossip, or
   * `undefined` for invalid input. Earlier entries may already have been applied.
   */
  apply(gossip: unknown): Result<T> | undefined {
    // Bind the algorithm to this live Projection; the type assertion does not transform the returned tuple.
    return apply.call(this, gossip) as Result<T> | undefined
  }
  /**
   * Prepares to sequence a projection, optionally hydrating from a trusted sequence stored by the application.
   *
   * @param actorID Actor identifier used in acknowledgements.
   * @param trustedSequence Optional dependency-ordered Sequence stored by the application.
   */
  constructor(
    public readonly actorID: number,
    trustedSequence?: unknown
  ) {
    // Hydrate the graph and initialize fresh session clocks before the instance is used.
    void create.call(this, trustedSequence)
  }

  /**
   * Inserts values at a Projection position.
   *
   * @param values Nonempty array of values to insert.
   * @param at Insertion position in `0..length()`, inclusive.
   * @returns Gossip describing the insertion.
   */
  insert(values: Array<T>, at: number): Gossip<T> {
    // Return canonical replication data for the edit already applied to this Projection.
    return insert.call(this, values, at) as Gossip<T>
  }
  /**
   * Returns the length, A.K.A. amount of entries of this projection.
   *
   * @returns Current Projection length.
   */
  length(): number {
    // Read the maintained visible count; length does not traverse structural history.
    return this.projectionFrameCount
  }
  /**
   * Applies relevant acknowledgements and nonduplicate insertions from a replica of the sequence.
   *
   * @param sequence Sequence to merge.
   * @returns Visible changes and optional acknowledgement Gossip, or
   * `undefined` if the Sequence has an invalid runtime shape.
   */
  merge(sequence: unknown): Result<T> | undefined {
    // Use the validated snapshot path while retaining this instance's materialized history.
    return merge.call(this, sequence) as Result<T> | undefined
  }
  /**
   * Removes an inclusive range of Projection positions.
   *
   * @param startAt First position to remove; defaults to 0.
   * @param endWith Last position to remove; defaults to `length() - 1`.
   * @returns Reducing Insertions and their acknowledgement as Gossip.
   */
  remove(startAt?: number, endWith?: number): Gossip<T> {
    // Delegate inclusive bounds; omitted arguments receive the algorithm's whole-Projection defaults.
    return remove.call(this, startAt, endWith) as Gossip<T>
  }
  /**
   * Replaces an inclusive range of Projection positions.
   *
   * @param withValues Replacement values; an empty array only removes the range.
   * @param startAt First position to replace; defaults to 0.
   * @param endWith Last position to replace; defaults to `length() - 1`.
   * @returns Removal and insertion Gossip, in that order.
   */
  replace(withValues: Array<T>, startAt?: number, endWith?: number): Gossip<T> {
    // Keep removal and insertion sequencing in one algorithm so returned Gossip preserves operation order.
    return replace.call(this, withValues, startAt, endWith) as Gossip<T>
  } /**
   * Retires an Actor from future compaction requirements.
   *
   * @remarks
   * This is a manual per-replica operation. The application is responsible for
   * deciding which Actors are retired and for propagating that decision to the
   * relevant replicas.
   *
   * Retiring an Actor removes its acknowledgements from the FrontierTable and
   * keeps the Actor retired for the lifetime of the current session. As a result,
   * its acknowledgements are excluded from later sequenced state and are not
   * required when compaction is performed while sequencing that state.
   *
   * For example, an Actor managing a document could rotate keys and propagate a
   * directive telling the relevant replicas which Actors to retire.
   *
   * @param actorID Number identifying the Actor whose acknowledgements are no
   * longer required for safe compaction.
   */
  retire(actorID: number): void {
    // Change acknowledgement membership only; retiring an Actor does not remove its authored Insertions.
    void this.frontierTable.eraseActor(actorID)
  }
  /**
   * Sequences state into a compact serializable format.
   *
   * @returns A Sequence with acknowledged removals compacted in the exported state.
   */
  sequence(): Sequence<T> {
    // Export compacted state without replacing this instance's live structural graph.
    return sequence.call(this) as Sequence<T>
  }
  /**
   * Returns the value at a Projection position.
   *
   * @param at Valid visible position in `0..length() - 1`.
   * @returns The corresponding Footage value.
   */
  value(at: number): T | undefined {
    // Read through visible-position resolution rather than indexing a structural Strip directly.
    return value.call(this, at) as T | undefined
  }
  /**
   * Returns values from an inclusive range of Projection positions.
   *
   * @param startAt First included position; defaults to 0.
   * @param endWith Last included position; defaults to `length() - 1`.
   * @returns A new array of values, or an empty array for an empty range.
   */
  values(startAt?: number, endWith?: number): Array<T> {
    // Materialize the inclusive visible range; underlying Footage references remain in place.
    return values.call(this, startAt, endWith) as Array<T>
  }
}

export type * from './types/type.js'
