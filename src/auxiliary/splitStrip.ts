import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'

/**
 * Splits one Strip into fragments at a zero-based logical anchor point.
 *
 * The existing Strip becomes the left fragment while the newly created Strip
 * becomes its right fragment, unless the right side is fully consumed.
 *
 * Splitting does not create a new insertion. Both fragments therefore retain
 * the original Strip's anchor and insertion identity. Only their fragment-local
 * effects and structural links differ.
 *
 * The retained effect accounts for any consumed Frames:
 *
 * `leftDiff + rightDiff === anchoringStripDiff + Math.min(0, incomingDiff)`
 *
 * @param this Projection containing the Strip.
 * @param anchoringStrip Strip to split. Becomes the left fragment.
 * @param anchorDiff Logical boundary in the original Insertion.
 * @param incomingDiff Incoming fragment effect; negative values consume Frames.
 * @returns The Strip immediately to the right of the anchoring Strip. When the
 * right fragment would have no effect, it is not materialized and the
 * original right step is returned instead.
 */
export function splitStrip<T>(
  this: Projection<T>,
  anchoringStrip: NonNullable<Strip<T>>,
  anchorDiff: number,
  incomingDiff: number
): Strip<T> {
  // Remove content.
  if (incomingDiff < 0 && anchoringStrip?.footage) {
    // Clear the consumed half-open Frame interval in place; retain the array's length and reference.
    void (anchoringStrip.footage as Array<T | undefined>).fill(
      undefined,
      anchorDiff,
      anchorDiff + Math.abs(incomingDiff)
    )
  }
  // Cache (used more than once).
  //
  // After the split, the original right neighbour follows the new right fragment.
  const rightStep = anchoringStrip.rightStep

  const anchoringStripDiff =
    anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff
  // Measure the left side from the current original offset and retain the anchoring Strip's effect direction.
  const leftFragmentDiff =
    (anchoringStripDiff < 0 ? -1 : 1) *
    (anchorDiff - (anchoringStrip.fragmentStart ?? 0))
  // The right side is the old effect minus the left effect and any newly consumed Frames.
  // A positive incoming Insertion adds its own Frames separately in anchorStrip.
  const rightFragmentDiff =
    anchoringStripDiff -
    leftFragmentDiff +
    (incomingDiff < 0 ? incomingDiff : 0)

  // The existing Strip always becomes the left side of the split.
  anchoringStrip.fragmentDiff = leftFragmentDiff

  // A fully consumed right side has no structural identity of its own. Keep
  // the existing fragment chain and structural links intact and let the
  // caller insert directly before the original right step.
  if (rightFragmentDiff === 0) return rightStep

  /**
   * Create the right fragment.
   *
   * Anchor and insertion metadata are copied unchanged because fragmentation
   * does not create a new insertion. `footage` is also shared by reference.
   *
   * Structural links are initialized so that:
   *
   *   anchoringStrip <-> rightFragment <-> rightStep
   *
   * The original Strip retains its outgoing jump until the edit patches or
   * divides that span. The new fragment starts without jump links.
   */
  const rightFragment: NonNullable<Strip<T>> = {
    anchorSession: anchoringStrip.anchorSession,
    anchorStart: anchoringStrip.anchorStart,
    anchorDiff: anchoringStrip.anchorDiff,

    insertionSession: anchoringStrip.insertionSession,
    insertionStart: anchoringStrip.insertionStart,
    insertionDiff: anchoringStrip.insertionDiff,

    // Only take reference.
    footage: anchoringStrip.footage,

    // A fragment does not independently inherit the original Strip's
    // right-side competitor relation.
    rightCompetitor: undefined,

    // Preserve the existing fragment chain by placing the new fragment between
    // the anchoring Strip and its previous right fragment.
    rightFragment: anchoringStrip.rightFragment,
    // A reducing edit consumes the prefix after the anchor; the retained right fragment begins after it.
    fragmentStart: anchorDiff + (incomingDiff < 0 ? Math.abs(incomingDiff) : 0),
    fragmentDiff: rightFragmentDiff,

    // The newly created fragment immediately follows the anchoring Strip.
    leftStep: anchoringStrip,

    // The new fragment has not yet been selected as a jump endpoint.
    leftJump: undefined,
    leftJumpFrameCount: 0,
    leftJumpStripCount: 0,

    // Preserve the original immediate right neighbour.
    rightStep,

    // Its original left fragment still owns the outgoing jump span.
    rightJump: undefined,
    rightJumpFrameCount: 0,
    rightJumpStripCount: 0,
  }

  // Update anchoring strip details.

  anchoringStrip.rightFragment = rightFragment
  anchoringStrip.rightStep = rightFragment

  // Set the right fragment of anchoring strip as left step for anchoring strips left step.
  //
  // More precisely, the Strip that previously followed `anchoringStrip`
  // must now follow `rightFragment`.
  if (rightStep) rightStep.leftStep = rightFragment
  // Splitting the visible tail moves its final Frame into the right fragment.
  if (anchoringStrip === this.tail) this.tail = rightFragment

  // Right fragment was added to structural order.
  //
  // Fragmentation retains the logical Insertion and adds one physical Strip.
  // Visible removal effects are accounted for by anchorStrip.
  ++this.structuralStripCount

  return rightFragment
}
