import type { Acknowledgement } from '../../types/type.js'

export class FrontierTable {
  private readonly actors: Set<number> = new Set()
  private readonly sessions: Map<number, Map<number, number>> = new Map()

  observeActor(actorID: number): void {
    void this.actors.add(actorID)
  }

  observeAcknowledgement(frontier: Acknowledgement): void {
    const actorID = frontier[0]
    if (!this.actors.has(actorID)) return

    for (let i = 1; i < frontier.length; i += 2) {
      const sessionID = frontier[i]
      const count = frontier[i + 1]

      const session = this.sessions.get(sessionID) ?? new Map<number, number>()

      if (session.size === 0) void this.sessions.set(sessionID, session)

      void session.set(actorID, count)
    }
  }

  getFrontiers(): Array<Acknowledgement> {
    const frontiers: Array<Acknowledgement> = []

    for (const actorID of this.actors) {
      const acknowledgement: Array<number> = [actorID]

      for (const [sessionID, session] of this.sessions) {
        const count = session.get(actorID)
        if (count === undefined) continue

        void acknowledgement.push(sessionID, count)
      }

      void frontiers.push(acknowledgement)
    }

    return frontiers
  }

  freeCompactedSessions(sessions: Array<number>): void {
    for (const sessionID of sessions) void this.sessions.delete(sessionID)
  }

  getCompactableSessions(): Array<number> {
    const ids: Array<number> = []

    for (const [sessionID, frontiers] of this.sessions) {
      if (frontiers.size !== this.actors.size) continue

      let expected: number | undefined

      let acknowledged = true

      for (const frontier of frontiers.values()) {
        if (expected === undefined) {
          expected = frontier
          continue
        }

        if (frontier !== expected) {
          acknowledged = false
          break
        }
      }

      if (acknowledged) void ids.push(sessionID)
    }

    return ids
  }

  getSafeSessionID(): number {
    const buffer = new Uint32Array(1)

    do {
      void crypto.getRandomValues(buffer)
    } while (this.sessions.has(buffer[0]))

    const sessionID = buffer[0]

    void this.sessions.set(sessionID, new Map())

    return sessionID
  }
}
