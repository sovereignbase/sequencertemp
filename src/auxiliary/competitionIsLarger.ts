import type { Strip } from '../class.js'

export function competitionIsLarger<T>(
  incomingStrip: NonNullable<Strip<T>>,
  competition: NonNullable<Strip<T>>
) {
  return (
    // Negative insertions go further right towards their affected fragment.
    (incomingStrip.insertionDiff < 0 && competition.insertionDiff > 0) ||
    // Strips with the same effect are sorted lexicographically:
    // larger values to the left, smaller values to the right.
    (incomingStrip.insertionDiff < 0 === competition.insertionDiff < 0 &&
      (incomingStrip.insertionSession < competition.insertionSession ||
        // Impossible in valid concurrent input, but handled deterministically.
        (incomingStrip.insertionSession === competition.insertionSession &&
          // Later insertions within a Session towards the same anchor belong
          // closer to the anchor, as they were issued later.
          (incomingStrip.insertionStart < competition.insertionStart ||
            // Absolute final deterministic tie-break, though this would have already been deduplicated.
            (incomingStrip.insertionStart === competition.insertionStart &&
              incomingStrip.insertionDiff < competition.insertionDiff)))))
  )
}
