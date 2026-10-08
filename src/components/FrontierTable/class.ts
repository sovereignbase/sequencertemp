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

    // Actor-only acknowledgements also establish membership and therefore affect compaction requirements.
    void this.actors.add(actorID)

    // Skip the Actor word and consume each validated Session/end pair together.
    for (let i = 1; i < frontier.length; i += 2) {
      const sessionID = frontier[i]
      const time = frontier[i + 1]

      // Keep each Session's Actor claims independent from other removal Sessions.
      const session = this.sessions.get(sessionID) ?? new Map<number, number>()

      // Register the map before its first admitted Actor claim; size does not verify a Session's mask coverage.
      if (session.size === 0) void this.sessions.set(sessionID, session)

      // This lookup uses actorID in the outer Session map; if absent, the fallback tests 0 < time.
      // It does not compare the previously stored Actor frontier for this Session.
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
      // Keep known membership even for Actors with no stored Session frontier.
      const acknowledgement: Array<number> = [actorID]

      for (const [sessionID, session] of this.sessions) {
        const time = session.get(actorID)
        // Omit absent claims rather than converting them into a reported zero frontier.
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
      // Every known active Actor must have a claim for this Session; partial membership cannot compact.
      if (frontiers.size !== this.actors.size) continue

      // The first stored claim sets the equality target; undefined is distinct from a logical time of zero.
      let expected: number | undefined

      let acknowledged = true

      for (const frontier of frontiers.values()) {
        // Use the first claim as a reference without requiring its time to be positive.
        if (expected === undefined) {
          expected = frontier
          continue
        }

        // Different reported ends block whole-Session compaction; this is equality, not a minimum frontier.
        if (frontier !== expected) {
          acknowledged = false
          break
        }
      }

      // Only unanimous equal reports make the Session eligible; payload completeness is not checked here.
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
    // Remember retirement so a delayed acknowledgement cannot reintroduce the Actor.
    void this.retirees.add(actorID)
    // Remove the Actor from the required consensus membership.
    void this.actors.delete(actorID)
    // Remove its stored claims as well, keeping per-Session claim counts consistent with membership.
    for (const session of this.sessions.values()) void session.delete(actorID)
  }
}
