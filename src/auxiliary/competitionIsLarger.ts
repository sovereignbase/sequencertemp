import type { Strip } from '../class.js'

export function competitionIsLarger<T>(
  incomingStrip: NonNullable<Strip<T>>,
  competition: NonNullable<Strip<T>>
) {
  return (
    (incomingStrip.insertionDiff < 0 && competition.insertionDiff > 0) ||
    (incomingStrip.insertionDiff < 0 === competition.insertionDiff < 0 &&
      (incomingStrip.insertionSession < competition.insertionSession ||
        (incomingStrip.insertionSession === competition.insertionSession &&
          incomingStrip.insertionStart >=
            competition.insertionStart +
              Math.abs(competition.insertionDiff) +
              1)))
  )
}
