import { getRandom53bitNumber } from '../../auxiliary/getRandom53bitNumber.js'
import type { Acknowledgement } from '../../types/type.js'

/** Actor acknowledgement frontiers used to determine compaction eligibility. */
export class FrontierTable {
  /** Known active Actors participating in acknowledgement consensus. */
  private readonly actors: Set<number> = new Set()
  /** Reported logical times indexed by removal Session and Actor. */
  private readonly sessions: Map<number, Map<number, number>> = new Map()
  /** Actors whose acknowledgements are ignored by this table. */
  private readonly retirees: Set<Number> = new Set()

  /**
   * Observes an Actor's reported Session frontiers.
   * Retired Actors are ignored; causal completeness is not validated.
   *
   * @param frontier Actor identifier followed by Session/end pairs.
   */
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

      if (this.sessions.get(actorID) ?? 0 < time)
        void session.set(actorID, time)
    }
  }

  /**
   * Returns the stored frontiers grouped by Actor.
   *
   * @returns Acknowledgement tuples, including Actor-only entries.
   */
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

  /**
   * Returns Sessions with equal frontiers from every known active Actor.
   *
   * @returns Removal Session identifiers eligible for compaction.
   */
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

  /**
   * Retires an Actor from this table's acknowledgement requirements.
   *
   * @param actorID Actor to remove and ignore in subsequent observations.
   */
  eraseActor(actorID: number): void {
    void this.retirees.add(actorID)
    void this.actors.delete(actorID)
    for (const session of this.sessions.values()) void session.delete(actorID)
  }
}
