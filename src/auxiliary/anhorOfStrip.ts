import type { Strip } from '../types/type.js'

/**
 * Determines whether one Strip is anchored to the end of another Strip's
 * originating insertion.
 *
 * The anchor relation matches when:
 *
 * - `strip.anchorSession` matches the anchor's `insertionSession`;
 * - `strip.anchorStart` matches the anchor's `insertionStart`;
 * - `strip.anchorDiff` equals the anchor's `insertionDiff`.
 *
 * Only insertions with a positive Projection effect can act as anchors, so
 * `insertionDiff` directly identifies the Frame position at the end of the
 * originating insertion.
 *
 * Fragmentation does not change the insertion identity or its original end
 * position. The comparison therefore intentionally uses `insertionSession`,
 * `insertionStart`, and `insertionDiff` rather than fragment-local metadata.
 *
 * @param anchor Candidate Strip whose originating insertion may provide the anchor.
 * @param strip Strip whose anchor relation is being tested.
 * @returns Whether `strip` is anchored to the end of `anchor`'s originating insertion.
 */
export function anchorOfStrip<T>(
  anchor: NonNullable<Strip<T>>,
  strip: NonNullable<Strip<T>>
) {
  return (
    // The Strip must refer to the same originating insertion.
    anchor.insertionSession === strip.anchorSession &&
    anchor.insertionStart === strip.anchorStart &&
    // The Strip must be anchored exactly at the end of that insertion.
    strip.anchorDiff === anchor.insertionDiff
  )
}
