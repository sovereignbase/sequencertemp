import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'

/**
 * Splits one Strip into two fragments after a zero-based anchor point.
 *
 * The existing Strip becomes the left fragment while the newly created Strip
 * becomes its right fragment. Together, the two fragments retain the complete
 * effect and Structural Order position of the original Strip.
 *
 * Splitting does not create a new insertion. Both fragments therefore retain
 * the original Strip's anchor and insertion identity. Only their fragment-local
 * effects and structural links differ.
 *
 * The total Projection effect remains unchanged:
 *
 * `leftDiff + rightDiff === anchoringStripDiff`
 *
 * `after` is the largest zero-based anchor point retained by the left fragment.
 * Its sign-independent magnitude determines the left fragment's effect; the
 * Strip's effect direction determines whether that effect is increasing or
 * reducing.
 *
 * @param this Projection containing the Strip.
 * @param anchoringStrip Strip to split. Becomes the left fragment.
 * @param after Largest zero-based anchor point retained by the left fragment.
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
    console.log(incomingDiff)
    void (anchoringStrip.footage as Array<T | undefined>).fill(
      undefined,
      anchorDiff,
      anchorDiff + Math.abs(incomingDiff)
    )
    console.log(anchoringStrip.footage)
  }
  // Cache (used more than once).
  //
  // These links belong to the original Strip's right boundary. After the
  // split, that boundary belongs to the newly created right fragment.
  const rightStep = anchoringStrip.rightStep
  const rightJump = anchoringStrip.rightJump

  const leftFragmentDiff = anchoringStrip.fragmentStart
    ? anchorDiff - anchoringStrip.fragmentStart
    : anchorDiff
  const rightFragmentDiff =
    anchoringStrip.insertionDiff -
    anchorDiff +
    (incomingDiff < 0 ? incomingDiff : 0)

  // The existing Strip always becomes the left side of the split.
  anchoringStrip.fragmentDiff = leftFragmentDiff

  // Its previous right jump crosses the insertion position and is no longer
  // valid, whether or not a right fragment needs to be materialized.
  anchoringStrip.rightJump = undefined
  anchoringStrip.rightJumpFrameCount = 0
  anchoringStrip.rightJumpStripCount = 0

  if (rightJump) rightJump.leftJump = undefined

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
   * Jump links are intentionally cleared because the split changes Structural
   * Order distances around this position.
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
    fragmentStart: anchorDiff + (incomingDiff < 0 ? Math.abs(incomingDiff) : 0),
    fragmentDiff: rightFragmentDiff,

    // The newly created fragment immediately follows the anchoring Strip.
    leftStep: anchoringStrip,

    // Jump information is invalidated around the structural modification.
    leftJump: undefined,
    leftJumpFrameCount: 0,
    leftJumpStripCount: 0,

    // Preserve the original immediate right neighbour.
    rightStep,

    // Jump information is invalidated around the structural modification.
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
  // If there anchoring had no right step it was tail and now right fragment is new tail.
  else this.tail = rightFragment

  // Right fragment was added to structural order.
  //
  // Fragmentation preserves the logical insertion and Projection effect, but
  // physically adds one Strip node to Structural Order.
  ++this.structuralStripCount

  return rightFragment
}
