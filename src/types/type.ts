/**
 * Materialized Structural Order node derived from one insertion or one of its
 * fragments.
 *
 * A Strip preserves the stable insertion coordinates while carrying the
 * mutable links and lengths required by the current materialization.
 */
export type Strip<T> =
  | {
      /** Actor or session identifier of the insertion containing the anchor. */
      readonly anchorSession: number

      /** Logical time identifying the insertion containing the anchor. */
      readonly anchorTime: number

      /** Stable Frame offset marking the boundary within the original anchor insertion. */
      readonly anchorFrame: number

      /** Actor or session identifier that issued this insertion. */
      readonly insertionSession: number

      /** Logical time of this insertion's zero-reservation. */
      readonly insertionTime: number

      /** Signed number of Frames added to or removed from the Projection. */
      readonly insertionDiff: number

      /** Optional Footage carried by an increasing insertion. */
      readonly footage?: ReadonlyArray<T | undefined>

      /** Next smaller concurrent insertion competing for the same boundary. */
      rightCompetitor?: Strip<T>

      /** Next fragment belonging to the same original insertion. */
      rightFragment?: Strip<T>

      /** Signed Projection effect represented by this fragment. */
      fragmentDiff?: number

      /** Immediately preceding Strip in Structural Order. */
      leftStep?: Strip<T>

      /** Strip reachable through the nearest left jump. */
      leftJump?: Strip<T>

      /** Number of Projection Frames crossed by the left jump. */
      leftJumpFrameCount?: number

      /** Number of Structural Order Strips crossed by the left jump. */
      leftJumpStripCount?: number

      /** Immediately following Strip in Structural Order. */
      rightStep?: Strip<T>

      /** Strip reachable through the nearest right jump. */
      rightJump?: Strip<T>

      /** Number of Projection Frames crossed by the right jump. */
      rightJumpFrameCount?: number

      /** Number of Structural Order Strips crossed by the right jump. */
      rightJumpStripCount?: number
    }
  | undefined

/**
 * Describes one insertion into Structural Order.
 *
 * @remarks
 * An insertion always has one of two effects on the Projection:
 * a negative `insertionDiff` decreases `visibleFrameCount`,
 * while a positive `insertionDiff` increases it.
 *
 * The absolute value of `insertionDiff` is the Frame length of the insertion,
 * while its sign determines its effect on the Projection.
 *
 * Structurally, every insertion grows the Sequence.
 * Its position is described commutatively so that it can be applied
 * idempotently to Structural Order.
 */
export type Insertion<T> = Readonly<
  [
    /** Session identifier of the anchoring insertion, i.e. its `insertionSession`. */
    anchorSession: number,

    /** Logical time of the Session when the anchoring insertion was made. */
    anchorTime: number,

    /** Frame offset within the original anchoring insertion, from its `insertionTime` towards `insertionEnd`, i.e. `insertionTime + |insertionDiff|`. */
    anchorFrame: number,

    /** Session identifier that issued this insertion. */
    insertionSession: number,

    /** Logical time at which this insertion begins. */
    insertionTime: number,

    /**
     * Signed Frame length of this insertion and its effect on the Projection.
     */
    insertionDiff: number,

    /** Optional Footage carried by a positive insertion. */
    footage?: ReadonlyArray<T | undefined>,
  ]
>

/**
 * Flat acknowledgement frontier.
 *
 * The first word identifies the acknowledging Actor, followed by repeating
 * `(sessionID, sessionTime)` pairs:
 * `[actorID, sessionID, sessionTime, sessionID, sessionTime, ...]`.
 *
 * Each `sessionID` uniquely identifies the removals issued during one
 * Sequence session, while `sessionTime` records the greatest logical time
 * observed for that session by the acknowledging Actor.
 */
export type Acknowledgement = ReadonlyArray<number>

/**
 * Replication unit containing either an insertion or an acknowledgement.
 *
 * An insertion is emitted as a result of a local update.
 *
 * An acknowledgement is emitted in response to merging a decreasing insertion.
 */
export type Gossip<T> = ReadonlyArray<Acknowledgement | Insertion<T>>

/**
 * Serializable state required to reconstruct a Projection.
 */
export type Snapshot<T> = Readonly<
  [
    /** Latest known acknowledgement frontiers. */
    frontiers: ReadonlyArray<Acknowledgement>,

    /** Insertions required to reconstruct Structural Order and the Projection. */
    projection: ReadonlyArray<Insertion<T>>,
  ]
>
/**
 * Consumer-facing Projection splice.
 *
 * Replaces the half-open range `[startAt, endAt)` with optional `values`.
 */
export type Splice<T> = Readonly<
  [startAt: number, endAt: number, values?: ReadonlyArray<T | undefined>]
>

/**
 * Ordered visible Projection mutations produced by applying remote data.
 */
export type Change<T> = ReadonlyArray<Splice<T>>

/**
 * Result of a mutating Projection operation.
 *
 * `change` describes the visible Projection mutations.
 *
 * `gossip` contains replication data when the operation emitted any.
 */
export type Result<T> = Readonly<[change: Change<T>, gossip?: Gossip<T>]>
