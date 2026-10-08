import { findProjectionPositionOfStrip } from '../auxiliary/findProjectionPositionOfStrip.js'
import { anchorStrip } from '../auxiliary/anchorStrip.js'
import { insertFirst } from '../auxiliary/insertFirst.js'
import { isAcknowledgement, isInsertion } from '../auxiliary/isGossip.js'
import type { Projection } from '../class.js'
import type {
  Acknowledgement,
  Change,
  Insertion,
  Result,
  Strip,
} from '../types/type.js'
import { findContainingFragment } from '../auxiliary/findContainingFragment.js'
import { findFramePositionByProjectionPosition } from '../auxiliary/findFramePositionByProjectionPosition.js'

/**
 * Applies received Gossip while preserving the cached projected position.
 *
 * @param this Projection receiving the Gossip.
 * @param gossip Batch of Insertions and Acknowledgements.
 * @returns Visible changes and optional acknowledgement Gossip, or
 * `undefined` for invalid input. Application is not transactional.
 */
export function apply<T>(
  this: Projection<T>,
  gossip: unknown
): Result<T> | undefined {
  // Reject a missing batch before iterating; individual tuples are checked below.
  if (!Array.isArray(gossip)) return

  // Save the consumer's numeric position before remote edits move traversal caches.
  const projectedPosition = this.projectedPosition
  // Changes use the visible coordinates after each preceding entry has applied.
  const changes = []
  const acknowledgements: Array<Acknowledgement> = []

  for (const entry of gossip) {
    // Acknowledgements update frontiers only; they have no structural or visible effect.
    if (isAcknowledgement(entry)) {
      void this.frontierTable.observeAcknowledgement(entry)
      continue
    }

    // Stop before interpreting invalid tuple fields. Earlier entries are not rolled back.
    if (!isInsertion<T>(entry)) return

    // Use one work stack for the entry and dependencies released by its materialization.
    const queue: Array<Insertion<T>> = [entry]

    while (queue.length !== 0) {
      // The nonempty-loop condition makes the popped Insertion available.
      const incoming = queue.pop()!

      // Only reducing sessions participate in removal acknowledgements.
      // Receipt is acknowledged before duplicate and dependency checks; this does not
      // verify that all earlier masks in the Session have arrived.
      if (incoming[5] < 0) {
        const acknowledgement: Acknowledgement = [
          this.actorID,
          incoming[3],
          // Subtracting the negative length gives the mask's original logical end.
          incoming[4] - incoming[5],
        ]

        void this.frontierTable.observeAcknowledgement(acknowledgement)
        void acknowledgements.push(acknowledgement)
      }

      // Deduplicate by immutable identity so retransmission cannot change length twice.
      // The receipt acknowledgement above can still be returned for a duplicate mask.
      if (this.containmentTable.has(incoming)) continue

      // Keep canonical tuple fields unchanged; Footage is retained by reference.
      const incomingStrip: NonNullable<Strip<T>> = {
        anchorSession: incoming[0],
        anchorStart: incoming[1],
        anchorDiff: incoming[2],
        insertionSession: incoming[3],
        insertionStart: incoming[4],
        insertionDiff: incoming[5],
        footage: incoming[6],
      }

      // All three zero anchor fields identify the virtual root, without a dependency Strip.
      const birth =
        incomingStrip.anchorSession === 0 &&
        incomingStrip.anchorStart === 0 &&
        incomingStrip.anchorDiff === 0
      let startAt = 0
      // Start with the original effect; overlap resolution may reduce the actual effect.
      let projectionDiff = incomingStrip.insertionDiff

      // Initialize the graph only for the first structural root. Later root Insertions
      // must compete against existing root subtrees, even if nothing is visible.
      if (birth && this.structuralStripCount === 0) {
        void insertFirst.call(this, incomingStrip)
      } else {
        let anchoringStrip: Strip<T>
        let anchorDiff = 0

        // The virtual root needs no containment lookup; other anchors identify an Insertion.
        if (!birth) {
          const origin = this.containmentTable.get(incoming)

          // Without the canonical parent, fragment placement is unresolved. Retain the tuple
          // in pending rather than guessing a visible position or dropping the operation.
          if (!origin) {
            void this.pendingTable.set(incoming)
            continue
          }

          // Resolve the current materialization from its original Strip, walking to the right.
          // The returned placement coordinate need not equal the immutable anchorDiff.
          ;[anchorDiff, anchoringStrip] = findContainingFragment(
            origin,
            incomingStrip
          )
        }

        // Apply the structural edit before resolving the Change's visible position.
        projectionDiff = anchorStrip.call(this, incomingStrip, anchoringStrip, anchorDiff)

        // Resolve once from the incoming Strip; gateDiff accounts for the old gate's shift.
        startAt = findProjectionPositionOfStrip.call(
          this,
          incomingStrip,
          projectionDiff
        )
        // Cache this edit's known position for subsequent entries in the same batch.
        this.gate = incomingStrip
        this.gatePosition = startAt
      }

      // Publish the identity only after placement, so released dependents can find it.
      void this.containmentTable.set(incomingStrip)

      // Emit only the actual visible effect. A fully overlapped mask may have zero effect.
      if (projectionDiff > 0) {
        // A positive edit at zero supplies the new first visible Strip directly.
        if (startAt === 0) this.head = incomingStrip
        // Equality with the updated length identifies an edit ending at the visible tail.
        if (startAt + projectionDiff === this.projectionFrameCount)
          this.tail = incomingStrip
        void changes.push([
          startAt,
          startAt,
          incomingStrip.footage ??
            // If no Footage was supplied, preserve the inserted Frame count in the Change.
            new Array<T | undefined>(incomingStrip.insertionDiff),
        ])
      } else if (projectionDiff < 0) {
        // The negative effect becomes the exclusive end of the removed visible range.
        void changes.push([startAt, startAt - projectionDiff])
      }

      // Detach only the bucket keyed by this newly materialized Insertion's identity.
      const pending = this.pendingTable.take(incomingStrip)

      if (pending)
        // Reverse-push preserves bucket arrival order when the LIFO stack pops its entries.
        for (let i = pending.length - 1; i >= 0; --i)
          void queue.push(pending[i])
    }
  }

  // Acknowledgement-only and pending-only batches do not require a visible gate refresh.
  if (changes.length !== 0) {
    // A Frame resolver needs a visible Frame; the empty branch clears the gate instead.
    if (this.projectionFrameCount > 0) {
      void findFramePositionByProjectionPosition.call(
        this,
        // Shortening may remove the saved index; resolve the last remaining Frame in that case.
        Math.min(projectedPosition, this.projectionFrameCount - 1)
      )
    } else {
      this.gate = undefined
      this.gatePosition = 0
    }
    // Restore the number after resolution; remote edits change its occupant, not the number.
    this.projectedPosition = projectedPosition
  }

  // Omit the reply slot when no reducing Insertion generated acknowledgement Gossip.
  return acknowledgements.length === 0
    ? [changes as unknown as Change<T>]
    : [changes as unknown as Change<T>, acknowledgements]
}
