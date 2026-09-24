import type { Projection } from '../class.js'
import type { Gossip, Strip } from '../types/type.js'

import { anchorStrip } from '../auxiliary/anchorStrip.js'
import { insertFirst } from '../auxiliary/insertFirst.js'
import { patchJumps } from '../auxiliary/patchJumps.js'
import { selectAnchor } from '../auxiliary/selectAnchor.js'

export function insert<T>(
  this: Projection<T>,
  values: Array<T>,
  at: number
): Gossip<T> {
  if (this.structuralStripCount === 0) {
    const increasingStrip: NonNullable<Strip<T>> = {
      anchorSession: 0,
      anchorStart: 0,
      anchorDiff: 0,
      insertionSession: this.increaseClock[0],
      insertionStart: this.increaseClock[1],
      insertionDiff: values.length,
      footage: values,
    }

    void insertFirst.call(this, increasingStrip)
    void this.containmentTable.set(increasingStrip)
    this.increaseClock[1] += values.length + 1

    return [
      [
        increasingStrip.anchorSession,
        increasingStrip.anchorStart,
        increasingStrip.anchorDiff,
        increasingStrip.insertionSession,
        increasingStrip.insertionStart,
        increasingStrip.insertionDiff,
        increasingStrip.footage,
      ],
    ]
  }

  const [anchorDiff, anchoringStrip] = selectAnchor.call(this, at) as [
    number,
    NonNullable<Strip<T>>,
  ]

  const increasingStrip: NonNullable<Strip<T>> = {
    anchorSession: anchoringStrip.insertionSession,
    anchorStart: anchoringStrip.insertionStart,
    anchorDiff: anchorDiff,
    insertionSession: this.increaseClock[0],
    insertionStart: this.increaseClock[1],
    insertionDiff: values.length,
    footage: values,
  }

  const previousStructuralStripCount = this.structuralStripCount

  void anchorStrip.call(
    this,
    increasingStrip,
    anchoringStrip,
    anchorDiff - (anchoringStrip.fragmentStart ?? 0)
  )

  void patchJumps.call(
    this,
    increasingStrip.insertionDiff,
    this.structuralStripCount - previousStructuralStripCount
  )

  void this.containmentTable.set(increasingStrip)
  this.gate = increasingStrip
  this.projectedPosition = at
  this.increaseClock[1] += values.length + 1

  return [
    [
      increasingStrip.anchorSession,
      increasingStrip.anchorStart,
      increasingStrip.anchorDiff,
      increasingStrip.insertionSession,
      increasingStrip.insertionStart,
      increasingStrip.insertionDiff,
      increasingStrip.footage,
    ],
  ]
}
