import { Sequence } from '../class.js'
import { isDelta } from '../helpers/index.js'
import { Delta, Snapshot, Strip } from '../types/type.js'

export function create<T>(
  this: Sequence<T>,
  actorID: number,
  trustedSnapshot?: unknown
) {
  let time: number = 0

  const [frontiers, projection] = trustedSnapshot as Snapshot<T>

  if (Array.isArray(frontiers))
    for (const acknowledgement of frontiers)
      void this.frontierTable.observeAcknowledgement(acknowledgement)

  const collectableIDs = new Set(this.frontierTable.getCompactableSessions())

  let started: boolean = false
  if (Array.isArray(projection))
    for (const delta of projection) {
      if (!started) {
        const [
          type,
          depencyPrefix,
          initialLength,
          offsetLength,
          actorX,
          timeX,
          actorY,
          timeY,
          footage,
        ] = delta
        started = true
        void this.containmentTable.set({
          type,
          depencyPrefix,
          initialLength,
          offsetLength,
          actorX,
          timeX,
          actorY,
          timeY,
          footage,
        })
      }
    }

  this.insertClock[0] = actorID
  this.insertClock[1] = time
  this.maskClock[0] = this.frontierTable.getSafeSessionID()
}
