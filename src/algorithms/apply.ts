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
import { linkJumps } from '../auxiliary/linkJumps.js'

/**
 * Applies received Gossip while retaining the local traversal Strip.
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

        // Local removal may have left gate on a mask; resolve only that hidden boundary.
        if (this.projectionFrameCount === 0) {
          this.gate = undefined
          this.gatePosition = 0
        } else if (
          this.gate &&
          (this.gate.fragmentDiff ?? this.gate.insertionDiff) <= 0
        )
          void findFramePositionByProjectionPosition.call(
            this,
            Math.min(this.gatePosition, this.projectionFrameCount - 1)
          )

        // Apply the structural edit before resolving the Change's visible position.
        projectionDiff = anchorStrip.call(
          this,
          incomingStrip,
          anchoringStrip,
          anchorDiff
        )

        let gateDiff = projectionDiff
        // A fragmented mask can remove Frames on both sides of a surviving local Strip.
        if (projectionDiff < 0 && incomingStrip.rightFragment && this.gate) {
          let parent: Strip<T> = this.gate
          while (
            parent &&
            !(
              parent.insertionSession === incomingStrip.anchorSession &&
              parent.insertionStart === incomingStrip.anchorStart
            ) &&
            !(
              parent.anchorSession === incomingStrip.anchorSession &&
              parent.anchorStart === incomingStrip.anchorStart
            )
          )
            parent = this.containmentTable.get([
              parent.anchorSession,
              parent.anchorStart,
              parent.anchorDiff,
              parent.insertionSession,
              parent.insertionStart,
              parent.insertionDiff,
            ])
          if (parent) {
            const boundary =
              parent.insertionSession === incomingStrip.anchorSession &&
              parent.insertionStart === incomingStrip.anchorStart
                ? (parent.fragmentStart ?? 0)
                : parent.anchorDiff
            gateDiff = 0
            // Count only this mask's actual consumed prefix before the local canonical boundary.
            for (
              let mask: Strip<T> = incomingStrip;
              mask && mask.anchorDiff + (mask.fragmentStart ?? 0) < boundary;
              mask = mask.rightFragment
            )
              gateDiff -= Math.min(
                -(mask.fragmentDiff ?? mask.insertionDiff),
                Math.max(
                  0,
                  boundary - mask.anchorDiff - (mask.fragmentStart ?? 0)
                )
              )
          }
        }

        // Resolve once from the incoming Strip; gateDiff accounts for the old gate's shift.
        startAt = findProjectionPositionOfStrip.call(
          this,
          incomingStrip,
          gateDiff
        )
        // Preserve the local Strip; only edits preceding it move its visible start.
        if (startAt <= this.gatePosition)
          this.gatePosition = Math.max(startAt, this.gatePosition + gateDiff)
        // Splitting at its start retains the local content in the original right fragment.
        if (projectionDiff > 0 && this.gate?.fragmentDiff === 0) {
          this.gate = this.gate.rightFragment
          // Promote the retained fragment so later lookups cannot lose its crossing span.
          const right = incomingStrip.rightJump
          if (right && right !== this.gate)
            linkJumps(
              this.gate!,
              right,
              incomingStrip.rightJumpFrameCount! - projectionDiff,
              incomingStrip.rightJumpStripCount! - 1
            )
          linkJumps(incomingStrip, this.gate!, projectionDiff, 1)
        }
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

      // A removed gate follows the surviving content at its visible boundary.
      if (this.projectionFrameCount === 0) {
        this.gate = undefined
        this.gatePosition = 0
      } else if (!this.gate) {
        this.gate = this.head
        this.gatePosition = 0
      } else if ((this.gate.fragmentDiff ?? this.gate.insertionDiff) <= 0) {
        void findFramePositionByProjectionPosition.call(
          this,
          Math.min(this.gatePosition, this.projectionFrameCount - 1)
        )
      }
      this.projectedPosition = this.gatePosition
      // Keep the local gate's outgoing span available to the next local edit.
      if (this.gate?.rightJump) {
        this.leftJumpToPatch = this.gate
        this.rightJumpToPatch = this.gate.rightJump
      }

      // Detach only the bucket keyed by this newly materialized Insertion's identity.
      const pending = this.pendingTable.take(incomingStrip)

      if (pending)
        // Reverse-push preserves bucket arrival order when the LIFO stack pops its entries.
        for (let i = pending.length - 1; i >= 0; --i)
          void queue.push(pending[i])
    }
  }

  // Omit the reply slot when no reducing Insertion generated acknowledgement Gossip.
  return acknowledgements.length === 0
    ? [changes as unknown as Change<T>]
    : [changes as unknown as Change<T>, acknowledgements]
}
