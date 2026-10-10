import type { Projection } from '../class.js'
import type { Gossip, Strip } from '../types/type.js'

import { anchorStrip } from '../auxiliary/anchorStrip.js'
import { insertFirst } from '../auxiliary/insertFirst.js'
import { patchJumps } from '../auxiliary/patchCursors.js'
import { selectAnchor } from '../auxiliary/selectAnchor.js'

/**
 * Sequences a local positive Insertion at a visible boundary.
 *
 * @param this Projection receiving the Insertion.
 * @param values Nonempty values array used as the Insertion's Footage.
 * @param at Projection boundary in `0..projectionFrameCount`, inclusive.
 * @returns Gossip containing the canonical Insertion.
 */
export function insert<T>(
  this: Projection<T>,
  values: Array<T>,
  at: number
): Gossip<T> {
  // With no visible Frame to anchor against, use the virtual root and initialize boundaries.
  if (this.projectionFrameCount === 0) {
    // The positive Session and its next logical time identify this new canonical Insertion.
    const increasingStrip: NonNullable<Strip<T>> = {
      anchorSession: 0,
      anchorStart: 0,
      anchorDiff: 0,
      insertionSession: this.increaseClock[0],
      insertionStart: this.increaseClock[1],
      insertionDiff: values.length,
      // Keep the caller's array as Footage; runtime fragmentation will share this reference.
      footage: values,
    }

    void insertFirst.call(this, increasingStrip)
    void this.containmentTable.set(increasingStrip)
    // Reserve the original Frame length plus one logical boundary unit before the next Insertion.
    this.increaseClock[1] += values.length + 1

    return [
      [
        increasingStrip.anchorSession,
        increasingStrip.anchorStart,
        increasingStrip.anchorDiff,
        increasingStrip.insertionSession,
        increasingStrip.insertionStart,
        increasingStrip.insertionDiff,
        increasingStrip.footage,
      ],
    ]
  }

  // Resolve the visible boundary once; the selected original Insertion supplies stable anchor fields.
  const [anchorDiff, anchoringStrip] = selectAnchor.call(this, at) as [
    number,
    NonNullable<Strip<T>>,
  ]

  const increasingStrip: NonNullable<Strip<T>> = {
    anchorSession: anchoringStrip.insertionSession,
    anchorStart: anchoringStrip.insertionStart,
    anchorDiff: anchorDiff,
    insertionSession: this.increaseClock[0],
    insertionStart: this.increaseClock[1],
    insertionDiff: values.length,
    footage: values,
  }

  // Splitting may add a fragment as well as the incoming Strip; patch the actual node-count change.
  const previousStructuralStripCount = this.structuralStripCount

  // Placement uses the resolved anchor; no second visible-position search is needed for a local edit.
  void anchorStrip.call(this, increasingStrip, anchoringStrip, anchorDiff)

  // Adjust a surviving cached jump by the visible effect and actual structural growth.
  void patchJumps.call(
    this,
    increasingStrip.insertionDiff,
    this.structuralStripCount - previousStructuralStripCount
  )

  void this.containmentTable.set(increasingStrip)
  // Only a positive-length Insertion can become the Strip containing visible position zero.
  if (values.length > 0 && at === 0) this.head = increasingStrip
  // Use the updated length to detect append and assign the last visible Strip directly.
  if (values.length > 0 && at + values.length === this.projectionFrameCount)
    this.tail = increasingStrip
  // The caller already supplied this visible index, so cache it without traversing again.
  this.gate = increasingStrip
  this.projectedPosition = at
  this.gatePosition = at
  // Advance by the immutable original length, independent of any surrounding fragmentation.
  this.increaseClock[1] += values.length + 1

  // Replicate the canonical Insertion, not its runtime fragments.
  return [
    [
      increasingStrip.anchorSession,
      increasingStrip.anchorStart,
      increasingStrip.anchorDiff,
      increasingStrip.insertionSession,
      increasingStrip.insertionStart,
      increasingStrip.insertionDiff,
      increasingStrip.footage,
    ],
  ]
}
