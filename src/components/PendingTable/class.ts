import type { Insertion, Strip } from '../../types/type.js'

/** Insertions awaiting materialization of their canonical dependency. */
export class PendingTable<T> {
  /** Pending buckets indexed by anchor Session and start. */
  private readonly insertions: Map<number, Map<number, Array<Insertion<T>>>> =
    new Map()

  /**
   * Queues an Insertion under its missing dependency.
   *
   * @param incoming Insertion to retain by reference.
   */
  set(incoming: Insertion<T>): void {
    // Group by canonical parent Session, then by parent start; anchorDiff does not identify a dependency.
    let sequencer = this.insertions.get(incoming[0])

    // Create the outer bucket only when this parent Session has no waiting Insertions.
    if (!sequencer) {
      sequencer = new Map()
      this.insertions.set(incoming[0], sequencer)
    }

    let pending = sequencer.get(incoming[1])

    // Different parent starts in one Session need independent release buckets.
    if (!pending) {
      pending = []
      sequencer.set(incoming[1], pending)
    }

    // Retain tuple and Footage references in arrival order; applied duplicates are checked during draining.
    pending.push(incoming)
  }

  /**
   * Detaches the Insertions waiting for a newly materialized dependency.
   *
   * @param incomingStrip Materialized Strip identifying the dependency.
   * @returns Its pending bucket in arrival order, or `undefined` if absent.
   */
  take(incomingStrip: NonNullable<Strip<T>>): Array<Insertion<T>> | undefined {
    // The new Strip's own identity is the parent identity its dependents were waiting for.
    const sequencer = this.insertions.get(incomingStrip.insertionSession)
    // No bucket for this Session means there is nothing to release.
    if (!sequencer) return

    const pending = sequencer.get(incomingStrip.insertionStart)
    // Other dependencies in the same Session remain pending.
    if (!pending) return

    // Detach before returning, preventing the same bucket from being released a second time.
    sequencer.delete(incomingStrip.insertionStart)

    // Delete the outer map only after its last dependency bucket has been detached.
    if (sequencer.size === 0)
      this.insertions.delete(incomingStrip.insertionSession)

    // Return the existing array; apply drains it without copying its Insertion payloads.
    return pending
  }
}
