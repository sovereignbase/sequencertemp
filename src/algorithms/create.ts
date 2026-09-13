import { Sequencer } from '../index.js'
import { isDelta } from '../helpers/index.js'
import { Delta, Strip } from '../types/type.js'

export function create<T>(
  this: Sequencer<T>,
  actorID: number,
  trustedSnapshot?: unknown
) {
  this.insertClock[0] = actorID
  let buf: Uint32Array<ArrayBuffer> | null = new Uint32Array(1)
  void crypto.getRandomValues(buf)
  this.maskClock[0] = buf[0]
  buf = null

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
}
