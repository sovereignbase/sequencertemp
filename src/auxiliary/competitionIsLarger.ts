import type { Strip } from '../class.js'

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
    (incomingStrip.insertionDiff < 0 === competition.insertionDiff < 0 &&
      (incomingStrip.insertionSession < competition.insertionSession ||
        (incomingStrip.insertionSession === competition.insertionSession &&
          incomingStrip.insertionStart >=
            competition.insertionStart +
              Math.abs(competition.insertionDiff) +
              1)))
  )
}
