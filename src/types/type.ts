export type Strip<T> =
  | {
      type: number
      depencyPrefix: number
      initialLength: number
      offsetLength: number
      actorX: number
      timeX: number
      actorY: number
      timeY: number

      footage?: Array<T | undefined>

      rightFragment?: Strip<T>
      fragmentLength?: number

      rightCompetitor?: Strip<T>

      leftStep?: Strip<T>
      leftJump?: Strip<T>
      leftJumpFrameCount?: number
      leftJumpStripCount?: number

      rightStep?: Strip<T>
      rightJump?: Strip<T>
      rightJumpFrameCount?: number
      rightJumpStripCount?: number
    }
  | undefined

export type Projection<T> = [
  type: number,
  depencyPrefix: number,
  initialLength: number,
  offsetLength: number,
  actorX: number,
  timeX: number,
  actorY: number,
  timeY: number,
  footage?: Array<T | undefined>,
]
/** [0] = ActorID ...SessionID, Count */
export type Acknowledgement = Uint32List

export type Delta<T> = [frontier: Acknowledgement, projection: Projection<T>]

export type Snapshot<T> = [
  frontiers: Array<Acknowledgement>,
  projection: Array<Projection<T>>,
]
