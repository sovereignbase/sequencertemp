import type { Strip } from '../class.js'

export function findContainingFragment<T>(
  origin: NonNullable<Strip<T>>,
  incomingStrip: NonNullable<Strip<T>>
): [NonNullable<Strip<T>>, number] {
  let anchoringStrip = origin
  let anchorFramePosition = incomingStrip.anchorDiff
  while (true) {
    const anchoringStripLength = Math.abs(
      anchoringStrip.fragmentDiff ?? anchoringStrip.insertionDiff
    )

    if (
      anchorFramePosition <= anchoringStripLength ||
      (incomingStrip.insertionDiff > 0 &&
        anchorFramePosition === anchoringStripLength &&
        anchoringStrip.rightFragment !== anchoringStrip.rightStep &&
        anchoringStrip.rightStep?.anchorSession ===
          incomingStrip.anchorSession &&
        anchoringStrip.rightStep.anchorStart === incomingStrip.anchorStart &&
        anchoringStrip.rightStep.anchorDiff === incomingStrip.anchorDiff)
    )
      break

    const rightFragment = anchoringStrip.rightFragment
    if (!rightFragment) break

    anchorFramePosition -= anchoringStripLength
    anchoringStrip = rightFragment
  }

  return [anchoringStrip, anchorFramePosition]
}
