import { getRandom53bitNumber } from '../../auxiliary/getRandom53bitNumber.js'
import type { Acknowledgement } from '../../types/type.js'

export class FrontierTable {
  private readonly actors: Set<number> = new Set()
  private readonly sessions: Map<number, Map<number, number>> = new Map()
  private readonly retirees: Set<Number> = new Set()

  observeAcknowledgement(frontier: Acknowledgement): void {
    const actorID = frontier[0]

    // Make sure an already retired actor is ignored during the session that retired it.
    if (this.retirees.has(actorID)) return

    void this.actors.add(actorID)

    for (let i = 1; i < frontier.length; i += 2) {
      const sessionID = frontier[i]
      const time = frontier[i + 1]

      const session = this.sessions.get(sessionID) ?? new Map<number, number>()

      if (session.size === 0) void this.sessions.set(sessionID, session)

      void session.set(actorID, time)
    }
  }

  getFrontiers(): Array<Acknowledgement> {
    const frontiers: Array<Acknowledgement> = []

    for (const actorID of this.actors) {
      const acknowledgement: Array<number> = [actorID]

      for (const [sessionID, session] of this.sessions) {
        const time = session.get(actorID)
        if (time === undefined) continue

        void acknowledgement.push(sessionID, time)
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

  eraseActor(actorID: number): void {
    void this.retirees.add(actorID)
    void this.actors.delete(actorID)
    for (const session of this.sessions.values()) void session.delete(actorID)
  }
}
