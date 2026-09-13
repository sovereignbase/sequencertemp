import { Acknowledgement } from '../types/type.js'

export class FrontierTable {
  private readonly actors: Set<number> = new Set()
  private readonly sessions: Map<number, Map<number, number>> = new Map()

  observeActor(actorID: number): void {
    void this.actors.add(actorID)
  }
  observeAcknowledgement(frontier: Acknowledgement): void {
    if (!this.actors.has(frontier[0])) return
    const actorID = frontier[0]
    for (let i = 1; i < frontier.length; i += 2) {
      const maskSession = this.sessions.get(i) ?? new Map<number, number>()
      if (maskSession.size === 0) void this.sessions.set(i, maskSession)
      void maskSession.set(actorID, frontier[i + 1])
    }
  }

  getFrontiers(): Array<Acknowledgement> {
    const frontiers: Array<Acknowledgement> = []
    for (const actor of this.actors) {
      const acknowledgement: Acknowledgement = [actor]
      for (const session of this.sessions.values())
        void acknowledgement.push(session.get(actor)!)
      void frontiers.push(acknowledgement)
    }
    return frontiers
  }

  getCompactableSessions(): Uint32List {
    const ids: Uint32List = []
    for (const [sessionID, frontiers] of this.sessions.entries()) {
      if (frontiers.size !== this.actors.size) continue
      const values = frontiers.values()
      const first = values.next()

      if (first.done) ids.push(sessionID)

      let acknowledged: boolean = false
      for (const frontier of values) {
        acknowledged = frontier === first.value
        if (!acknowledged) break
      }

      if (!acknowledged) continue

      void ids.push(sessionID)
    }

    return ids
  }

  getSafeSessionID(): number {
    const buf: Uint32Array<ArrayBuffer> | null = new Uint32Array(1)
    void crypto.getRandomValues(buf)
    while (this.sessions.has(buf[0])) void crypto.getRandomValues(buf)
    void this.sessions.set(buf[0], new Map())
    return buf[0]
  }
}
