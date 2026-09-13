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

      footageFrameIndex?: number

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

export type Delta = [
  type: number,
  depencyPrefix: number,
  initialLength: number,
  offsetLength: number,
  actorX: number,
  timeX: number,
  actorY: number,
  timeY: number,
]
/** [0] = ActorID ...SessionID, Count */
export type Acknowledgement = Uint32List

export type Snapshot<T> = [
  frontiers: Array<Acknowledgement>,
  projection: Array<Delta>,
  footage?: Array<T | undefined>,
]
export type ActorIdMap = Record<string, number>
