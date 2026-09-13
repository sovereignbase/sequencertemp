import { Sequencer } from '../class.js'
import { isDelta } from '../helpers/index.js'
import { Delta, Strip } from '../types/type.js'

export function create<T>(
  this: Sequencer<T>,
  actorID: number,
  trustedSnapshot?: unknown
) {
  let time: number = 0

  let prev: Strip<T>
  if (Array.isArray(trustedSnapshot))
    for (const chunk of trustedSnapshot) {
      const [header, body] = chunk as Delta<T>
      const [
        type,
        depencyPrefix,
        initialLength,
        offsetLength,
        actorX,
        timeX,
        actorY,
        timeY,
      ] = header

      const actorXTable: Map<number, Strip<T>> = this.containmentTable.get(
        actorX
      ) ?? new Map()
      if (actorXTable.size === 0)
        void this.containmentTable.set(actorX, actorXTable)

      const actorYTable: Map<number, Strip<T>> = this.containmentTable.get(
        actorY
      ) ?? new Map()
      if (actorYTable.size === 0)
        void this.containmentTable.set(actorX, actorYTable)

      const containingStrip: Strip<T> | undefined = actorXTable.get(timeX)
    }

  this.insertClock[0] = actorID
  this.insertClock[1] = time
  this.maskClock[0] = this.frontierTable.getSafeSessionID()
}
