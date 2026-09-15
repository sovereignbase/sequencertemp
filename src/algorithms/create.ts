import { Sequence } from '../class.js'
import { isDelta } from '../helpers/index.js'
import { Delta, Snapshot, Strip } from '../types/type.js'

export function create<T>(
  this: Sequence<T>,
  actorID: number,
  trustedSnapshot?: unknown
): void {
  let time: number = 0

  const snapshot = Array.isArray(trustedSnapshot)
    ? (trustedSnapshot as Snapshot<T>)
    : undefined

  const frontiers = snapshot?.[0]
  const projection = snapshot?.[1]

  if (Array.isArray(frontiers)) {
    // Actors must exist before acknowledgements are observed.
    for (const acknowledgement of frontiers) {
      if (acknowledgement.length === 0) continue
      void this.frontierTable.observeActor(acknowledgement[0])
    }

    for (const acknowledgement of frontiers)
      void this.frontierTable.observeAcknowledgement(acknowledgement)
  }

  const compactableIDs = new Set(this.frontierTable.getCompactableSessions())

  let started: boolean = false

  if (Array.isArray(projection))
    for (const incoming of projection) {
      if (!isDelta(incoming)) continue

      const delta = incoming as Delta<T>

      // compact snapshot by not minting compactable masks
      if (compactableIDs.has(delta[6])) continue

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

      if (actorY === actorID) time = Math.max(time, timeY + initialLength + 1)

      if (!started) {
        const strip: NonNullable<Strip<T>> = {
          type,
          depencyPrefix,
          initialLength,
          offsetLength,
          actorX,
          timeX,
          actorY,
          timeY,
          footage,
        }

        this.head = strip
        this.gate = strip
        this.tail = strip

        this.structuralStripCount = 1
        this.visibleFrameCount = initialLength
        this.visibleIndex = 0

        void this.containmentTable.set(strip)

        started = true
        continue
      }

      this.patch(delta)
    }

  // The current actor becomes part of the frontier only after determining
  // what was already compactable in the stored snapshot.
  void this.frontierTable.observeActor(actorID)

  this.insertClock[0] = actorID
  this.insertClock[1] = time

  this.maskClock[0] = this.frontierTable.getSafeSessionID()
  this.maskClock[1] = 0

  void this.frontierTable.freeCompactedSessions(Array.from(compactableIDs))
}
