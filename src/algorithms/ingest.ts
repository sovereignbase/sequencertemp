import { findVisibleIndexOfStrip } from '../auxiliary/findVisibleIndexOfStrip.js'
import { insertAfter } from '../auxiliary/insertAfter.js'
import { insertBefore } from '../auxiliary/insertBefore.js'
import { insertFirst } from '../auxiliary/insertFirst.js'
import { isAcknowledgement, isInsertion } from '../auxiliary/isDelta.js'
import { patchJumps } from '../auxiliary/patchJumps.js'
import type { Sequence } from '../class.js'
import type { Acknowledgement, Delta, Strip } from '../types/type.js'

export function ingest<T>(this: Sequence<T>, data: unknown): Delta<T> | void {
  if (isInsertion<T>(data)) {
    if (this.containmentTable.has(data)) return

    const incomingStrip: NonNullable<Strip<T>> = {
      anchorSequencer: data[0],
      anchorTime: data[1],
      anchorFrame: data[2],
      insertionSequencer: data[3],
      insertionTime: data[4],
      insertionDiff: data[5],
      footage: data[6],
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
        const origin = this.containmentTable.get(data)
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

      return
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

    return [acknowledgement]
  }

  if (isAcknowledgement(data))
    return void this.frontierTable.observeAcknowledgement(data)
}
