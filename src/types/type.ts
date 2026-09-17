/**
 * Runtime-inferred Sequence Strip representing one Insertion or one of its
 * fragments.
 *
 * @remarks
 * A Strip groups multiple Frames belonging to the same Insertion, allowing
 * more than one Footage Frame to be inserted and traversed as a single
 * structural unit.
 *
 * The insertion coordinates are immutable and remain unchanged when a Strip is
 * fragmented. Runtime fields describe the current materialization of that
 * Insertion within Sequence.
 */
export type Strip<T> =
  | {
      /** `insertionSession` of the anchoring insertion. */
      readonly anchorSession: number

      /** `insertionStart` of the anchoring insertion. */
      readonly anchorStart: number

      /** Difference from the anchoring insertion's `insertionStart` towards its `insertionEnd`, identifying the exact anchor point as `anchorStart + anchorDiff`. */
      readonly anchorDiff: number

      /** Number identifying the Session that sequenced this insertion. */
      readonly insertionSession: number

      /** Numerical point identifying this Insertion within a Session's logical time space. */
      readonly insertionStart: number

      /** Signed Frame length of the original Insertion and its effect on the Projection. */
      readonly insertionDiff: number

      /** Optional Footage carried by a positive Insertion. */
      readonly footage?: ReadonlyArray<T | undefined>

      /** Next lexicographically smaller concurrent Insertion competing for the same anchor point. */
      rightOverlap?: Strip<T>

      /** Next fragment belonging to the same original Insertion. */
      rightFragment?: Strip<T>

      /** Signed Projection effect represented by this fragment. */
      fragmentDiff?: number
      /** Immediately preceding Strip in Sequence. */
      leftStep?: Strip<T>

      /** Strip reachable through a possible left jump. */
      leftJump?: Strip<T>

      /** Number of Projection Frames crossed by the left jump. */
      leftJumpFrameCount?: number

      /** Number of Sequence Strips crossed by the left jump. */
      leftJumpStripCount?: number

      /** Immediately following Strip in Sequence. */
      rightStep?: Strip<T>

      /** Strip reachable through a possible right jump. */
      rightJump?: Strip<T>

      /** Number of Projection Frames crossed by the right jump. */
      rightJumpFrameCount?: number

      /** Number of Sequence Strips crossed by the right jump. */
      rightJumpStripCount?: number
    }
  | undefined

/**
 * Describes one insertion into Sequence.
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
 * Its position is described commutatively so it can be applied
 * idempotently into Sequence.
 */
export type Insertion<T> = Readonly<
  [
    /** `insertionSession` of the anchoring insertion. */
    anchorSession: number,

    /** `insertionStart` of the anchoring insertion. */
    anchorStart: number,

    /** Difference from the anchoring insertion's `insertionStart` towards its `insertionEnd`, identifying the exact anchor point as `anchorStart + anchorDiff`. */
    anchorDiff: number,

    /** Number identifying the Session that sequenced this insertion. */
    insertionSession: number,

    /** Numerical point identifying this Insertion within a Session's logical time space. */
    insertionStart: number,

    /** Signed Frame length of this insertion and its effect on the Projection. */
    insertionDiff: number,

    /** Optional Footage carried by a positive insertion. */
    footage?: ReadonlyArray<T | undefined>,
  ]
>

/**
 * Describes one Actor's acknowledgement frontier.
 *
 * @remarks
 * The first word identifies the acknowledging Actor, followed by repeating
 * `(sessionID, sessionEnd)` pairs:
 * `[actorID, sessionID, sessionEnd, sessionID, sessionEnd, ...]`.
 *
 * Each `sessionID` uniquely identifies the removals issued during one
 * sequencing session, while `sessionEnd` records the greatest logical time
 * observed for that session by the acknowledging Actor.
 */
export type Acknowledgement = ReadonlyArray<number>

/**
 * Replication unit containing either an insertion or an acknowledgement.
 *
 * @remarks
 * An insertion is emitted as a result of a local update.
 *
 * An acknowledgement is emitted in response to merging a decreasing insertion.
 */
export type Gossip<T> = ReadonlyArray<Acknowledgement | Insertion<T>>

/**
 * Serializable state required to reconstruct a Projection.
 */
export type Sequence<T> = Readonly<
  [
    /** Latest known acknowledgement frontiers. */
    frontiers: ReadonlyArray<Acknowledgement>,

    /** Insertions required to reconstruct Sequence and derive the Projection. */
    insertions: ReadonlyArray<Insertion<T>>,
  ]
>

/**
 * Consumer-facing Projection splice.
 *
 * @remarks
 * Replaces the inclusive range `[startAt, endWith]` with optional `values`.
 */
export type Splice<T> = Readonly<
  [startAt: number, endWith: number, values?: ReadonlyArray<T | undefined>]
>

/**
 * Ordered visible Projection mutations produced by applying remote data.
 */
export type Change<T> = ReadonlyArray<Splice<T>>

/**
 * Result of a mutating Projection operation.
 *
 * @remarks
 * `change` describes the visible Projection mutations.
 *
 * `gossip` contains replication data when the operation emitted any.
 */
export type Result<T> = Readonly<[change: Change<T>, gossip?: Gossip<T>]>
