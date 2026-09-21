import type { Strip } from '../types/type.js'

/**
 * Determines whether a Strip's stable anchor is contained within a Frame range
 * of another Strip's originating insertion.
 *
 * The anchor relation is identified through the stable insertion coordinates:
 *
 * - `strip.anchorSession` must match `anchor.insertionSession`;
 * - `strip.anchorStart` must match `anchor.insertionStart`;
 * - `strip.anchorDiff` must fall within the inclusive Frame range
 *   `[startFrame, endFrame]`.
 *
 * The Frame range is expressed in the coordinate space of the anchor's
 * originating insertion. This allows the same predicate to be used both for
 * complete insertion ranges and for individual fragments by supplying the
 * corresponding stable Frame boundaries.
 *
 * Passing the same value for `startFrame` and `endFrame` restricts containment
 * to one exact anchor Frame.
 *
 * Fragmentation does not change the insertion identity or stable anchor
 * coordinates, so the comparison intentionally uses `insertionSession`,
 * `insertionStart`, and `anchorDiff` rather than fragment-local identities.
 *
 * @param anchor Strip whose originating insertion defines the anchor space.
 * @param strip Strip whose stable anchor is being tested.
 * @param startFrame Inclusive first Frame of the accepted anchor range.
 * @param endFrame Inclusive last Frame of the accepted anchor range.
 * @returns Whether `strip` is anchored within the specified Frame range of
 * `anchor`'s originating insertion.
 */
export function containsAnchor<T>(
  anchor: NonNullable<Strip<T>>,
  strip: NonNullable<Strip<T>>,
  startFrame: number,
  endFrame: number
): boolean {
  return (
    // The stable anchor must refer to the same originating insertion.
    anchor.insertionSession === strip.anchorSession &&
    anchor.insertionStart === strip.anchorStart &&
    // The stable anchor Frame must fall within the inclusive accepted range.
    strip.anchorDiff >= startFrame &&
    strip.anchorDiff <= endFrame
  )
}
