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
      readonly anchorSequencer: number

      /** Logical time identifying the insertion containing the anchor. */
      readonly anchorTime: number

      /** Stable Frame offset marking the boundary within the original anchor insertion. */
      readonly anchorFrame: number

      /** Actor or session identifier that issued this insertion. */
      readonly insertionSequencer: number

      /** Logical time identifying this insertion. */
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
 * An insertion always has one of two effects on the Projection:
 * a negative `insertionDiff` decreases `visibleFrameCount`,
 * while a positive `insertionDiff` increases it.
 *
 * Structural placement is independent of the effect direction.
 */
export type Insertion<T> = Readonly<
  [
    /** Actor or session identifier of the insertion containing the anchor. */
    anchorSequencer: number,

    /** Logical time identifying the insertion containing the anchor. */
    anchorTime: number,

    /** Stable Frame offset marking the boundary within the original anchor insertion. */
    anchorFrame: number,

    /** Actor or session identifier that issued this insertion. */
    insertionSequencer: number,

    /** Logical time identifying this insertion. */
    insertionTime: number,

    /** Signed number of Frames added to or removed from the Projection. */
    insertionDiff: number,

    /** Optional Footage carried by an increasing insertion. */
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
export type Delta<T> = ReadonlyArray<Acknowledgement | Insertion<T>>

/**
 * Serializable state required to reconstruct a Sequence.
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
 * Flat list of changed Projection spans.
 *
 * Changes are encoded as repeating `[startAt, endAt]` pairs:
 * `[startAt, endAt, startAt, endAt, ...]`.
 *
 * Each pair identifies one contiguous Projection range affected by a
 * materialized update. Multiple pairs are emitted when one operation affects
 * disjoint ranges.
 *
 * `startAt` is inclusive and `endAt` is exclusive.
 */
export type Change = ReadonlyArray<number>

/**
 * Result of a mutating Sequence operation.
 *
 * `change` describes the affected Projection spans.
 *
 * `delta` contains replication data when the operation emitted any.
 */
export type Result<T> = Readonly<[change: Change, delta?: Delta<T>]>
