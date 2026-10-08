import type { Strip } from '../class.js'

/**
 * Determines whether a same-anchor competitor precedes the incoming Insertion.
 *
 * Positive Insertions precede reducing Insertions. Within either group,
 * larger Session identifiers precede smaller ones, then larger insertion starts.
 *
 * @param incomingStrip Insertion being positioned.
 * @param competition Existing competitor at the same canonical anchor.
 * @returns Whether the competitor sorts before the incoming Insertion.
 */
export function competitionIsLarger<T>(
  incomingStrip: NonNullable<Strip<T>>,
  competition: NonNullable<Strip<T>>
) {
  return (
    // Negative insertions go further right towards their affected fragment.
    (incomingStrip.insertionDiff < 0 && competition.insertionDiff > 0) ||
    // Strips with the same effect from different Sessions are sorted by their
    // Session identifiers. Within one Session, its reserved logical time range
    // tells whether the incoming insertion was authored after this competitor.
    // Apply the numerical tie-breaks only within the same effect group; the sign rule above orders groups.
    (incomingStrip.insertionDiff < 0 === competition.insertionDiff < 0 &&
      // Descending Session order makes same-anchor placement independent of arrival order.
      (incomingStrip.insertionSession < competition.insertionSession ||
        // Only equal Sessions use insertionStart as the next tie-break; equal own identities are duplicates.
        (incomingStrip.insertionSession === competition.insertionSession &&
          incomingStrip.insertionStart < competition.insertionStart)))
  )
}
