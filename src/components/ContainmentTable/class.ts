import type { Insertion, Strip } from '../../types/type.js'

/** Canonical identity index of materialized original Insertions. */
export class ContainmentTable<T> {
  /** Original Strips indexed by Insertion Session and start. */
  private readonly strips: Map<number, Map<number, Strip<T>>> = new Map()

  /**
   * Checks whether an Insertion is already materialized.
   *
   * @param incomingInsertion Insertion whose own identity is tested.
   * @returns Whether its Session and start are indexed.
   */
  has(incomingInsertion: Insertion<T>): boolean {
    // Own Session/start fields detect duplicates; anchor fields instead identify the dependency.
    const sequencer = this.strips.get(incomingInsertion[3])
    // A missing Session map proves the Insertion has not been materialized.
    if (sequencer) return sequencer.has(incomingInsertion[4])
    return false
  }

  /**
   * Returns an Insertion's canonical anchoring Strip.
   *
   * @param incomingInsertion Insertion identifying its dependency by anchor Session and start.
   * @returns The dependency's original Strip, or `undefined` if absent.
   */
  get(incomingInsertion: Insertion<T>): Strip<T> {
    // Dependency lookup uses the parent Insertion's identity, not the incoming Insertion's identity.
    const sequencer = this.strips.get(incomingInsertion[0])
    if (!sequencer) return undefined

    // Return the original Strip; current fragments are resolved through its rightFragment chain.
    return sequencer.get(incomingInsertion[1])
  }

  /**
   * Indexes a Strip by its own canonical Insertion identity.
   *
   * @param incomingStrip Original Strip to retain by reference.
   */
  set(incomingStrip: NonNullable<Strip<T>>): void {
    const sequencer =
      this.strips.get(incomingStrip.insertionSession) ?? new Map()

    // Register a newly created Session map before adding its first Strip.
    if (sequencer.size === 0)
      void this.strips.set(incomingStrip.insertionSession, sequencer)

    // Store the Strip reference so later runtime fragmentation remains reachable from this index.
    void sequencer.set(incomingStrip.insertionStart, incomingStrip)
  }
}
