import { findVisibleIndexOfStrip } from '../auxiliary/findVisibleIndexOfStrip.js'
import { insertAfter } from '../auxiliary/insertAfter.js'
import { insertBefore } from '../auxiliary/insertBefore.js'
import { insertFirst } from '../auxiliary/insertFirst.js'
import { isAcknowledgement, isInsertion } from '../auxiliary/isDelta.js'
import { patchJumps } from '../auxiliary/patchJumps.js'
import type { Sequence } from '../class.js'
import type { Acknowledgement, Delta, Strip } from '../types/type.js'

export function apply<T>(this: Sequence<T>, data: unknown): Delta<T> | void {
  if (!Array.isArray(data)) return

  const acknowledgements: Array<Acknowledgement> = []

  for (const entry of data) {
    if (isAcknowledgement(entry)) {
      this.frontierTable.observeAcknowledgement(entry)
      continue
    }

    if (!isInsertion<T>(entry)) return
    if (this.containmentTable.has(entry)) continue

    const incomingStrip: NonNullable<Strip<T>> = {
      anchorSequencer: entry[0],
      anchorTime: entry[1],
      anchorFrame: entry[2],
      insertionSequencer: entry[3],
      insertionTime: entry[4],
      insertionDiff: entry[5],
      footage: entry[6],
    }

    const birth =
      incomingStrip.anchorSequencer === 0 &&
      incomingStrip.anchorTime === 0 &&
      incomingStrip.anchorFrame === 0

    if (birth && this.structuralStripCount === 0) {
      insertFirst.call(this, incomingStrip)
    } else {
      let containingStrip: NonNullable<Strip<T>>
      let targetFramePosition: number

      if (birth) {
        containingStrip = this.head!
        targetFramePosition = 0
      } else {
        const origin = this.containmentTable.get(entry)
        if (!origin) return

        containingStrip = origin
        targetFramePosition = incomingStrip.anchorFrame

        while (true) {
          const containingStripLength = Math.abs(
            containingStrip.fragmentDiff ?? containingStrip.insertionDiff
          )

          if (targetFramePosition < containingStripLength) break

          const rightFragment = containingStrip.rightFragment
          if (!rightFragment) break

          targetFramePosition -= containingStripLength
          containingStrip = rightFragment
        }
      }

      findVisibleIndexOfStrip.call(this, containingStrip)

      const previousStructuralStripCount = this.structuralStripCount

      if (targetFramePosition === 1)
        insertBefore.call(this, incomingStrip, containingStrip)
      else
        insertAfter.call(
          this,
          incomingStrip,
          containingStrip,
          targetFramePosition
        )

      patchJumps.call(
        this,
        incomingStrip.insertionDiff,
        this.structuralStripCount - previousStructuralStripCount
      )
    }

    this.containmentTable.set(incomingStrip)

    if (incomingStrip.insertionDiff > 0) {
      this.frontierTable.observeActor(incomingStrip.insertionSequencer)

      if (incomingStrip.insertionSequencer === this.increaseClock[0])
        this.increaseClock[1] = Math.max(
          this.increaseClock[1],
          incomingStrip.insertionTime
        )

      continue
    }

    if (incomingStrip.insertionSequencer === this.decreaseClock[0])
      this.decreaseClock[1] = Math.max(
        this.decreaseClock[1],
        incomingStrip.insertionTime
      )

    const acknowledgement: Acknowledgement = [
      this.increaseClock[0],
      incomingStrip.insertionSequencer,
      incomingStrip.insertionTime,
    ]

    this.frontierTable.observeAcknowledgement(acknowledgement)
    acknowledgements.push(acknowledgement)
  }

  return acknowledgements.length === 0 ? undefined : acknowledgements
}
