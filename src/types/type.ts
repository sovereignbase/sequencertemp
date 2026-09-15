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
      readonly anchorActor: number

      /** Logical time identifying the insertion containing the anchor. */
      readonly anchorTime: number

      /** Stable Frame offset marking the boundary within the original anchor insertion. */
      readonly anchorFrame: number

      /** Actor or session identifier that issued this insertion. */
      readonly insertionActor: number

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
    anchorActor: number,

    /** Logical time identifying the insertion containing the anchor. */
    anchorTime: number,

    /** Stable Frame offset marking the boundary within the original anchor insertion. */
    anchorFrame: number,

    /** Actor or session identifier that issued this insertion. */
    insertionActor: number,

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
 */
export type Acknowledgement = ReadonlyArray<number>

/**
 * Replication unit containing the causal frontier observed when an insertion
 * was issued and the insertion itself.
 */
export type Delta<T> = Readonly<
  [
    /** Causal frontier observed by the issuing replica. */
    frontier: Acknowledgement,

    /** Insertion replicated by this Delta. */
    projection: Insertion<T>,
  ]
>

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
