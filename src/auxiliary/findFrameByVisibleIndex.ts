import type { Sequence } from '../class.js'
import type { Strip } from '../types/type.js'

export function findFrameByVisibleIndex<T>(
  this: Sequence<T>,
  index: number
): number {
  let cursorStrip: NonNullable<Strip<T>> = this.gate!
  let cursorIndex: number = this.visibleIndex

  let leftJumpToPatch = this.leftJumpToPatch
  let rightJumpToPatch = this.rightJumpToPatch

  const distanceToTravel = Math.abs(this.visibleIndex - index)

  if (index < distanceToTravel) {
    cursorStrip = this.head!
    cursorIndex = 0

    leftJumpToPatch = cursorStrip
    rightJumpToPatch = cursorStrip.rightJump
  }

  const optimalJumpSpacing = Math.round(Math.sqrt(this.structuralStripCount))

  while (true) {
    const cursorDiff = cursorStrip.fragmentDiff ?? cursorStrip.insertionDiff
    const stripLength = cursorDiff > 0 ? cursorDiff : 0

    if (cursorIndex <= index && index < cursorIndex + stripLength) {
      this.gate = cursorStrip
      this.visibleIndex = cursorIndex

      this.leftJumpToPatch = leftJumpToPatch
      this.rightJumpToPatch = rightJumpToPatch

      return index - cursorIndex + 1
    }

    const currentDistance = Math.abs(cursorIndex - index)

    if (cursorIndex <= index) {
      // Traverse right
      const walkStrip = cursorStrip.rightStep!
      const walkIndex = cursorIndex + cursorDiff
      const walkDistance = Math.abs(walkIndex - index)

      let rightJump = cursorStrip.rightJump

      if (rightJump && cursorIndex >= 0) {
        let rightJumpFrameCount = cursorStrip.rightJumpFrameCount!
        let rightJumpStripCount = cursorStrip.rightJumpStripCount!

        if (
          rightJumpStripCount < optimalJumpSpacing &&
          rightJump !== this.tail
        ) {
          const nextRightJump = rightJump.rightJump

          if (
            nextRightJump &&
            rightJump.rightJumpStripCount! <=
              optimalJumpSpacing - rightJumpStripCount
          ) {
            rightJumpFrameCount += rightJump.rightJumpFrameCount!
            rightJumpStripCount += rightJump.rightJumpStripCount!

            cursorStrip.rightJump = nextRightJump
            cursorStrip.rightJumpFrameCount = rightJumpFrameCount
            cursorStrip.rightJumpStripCount = rightJumpStripCount

            nextRightJump.leftJump = cursorStrip
            nextRightJump.leftJumpFrameCount = rightJumpFrameCount
            nextRightJump.leftJumpStripCount = rightJumpStripCount

            rightJump.leftJump = undefined
            rightJump.rightJump = undefined

            rightJump = nextRightJump
          }
        }

        const jumpIndex = cursorIndex + rightJumpFrameCount

        if (cursorIndex <= index && index <= jumpIndex) {
          leftJumpToPatch = cursorStrip
          rightJumpToPatch = rightJump
        }

        const jumpDistance = Math.abs(jumpIndex - index)

        if (jumpDistance < currentDistance && jumpDistance < walkDistance) {
          cursorStrip = rightJump
          cursorIndex = jumpIndex
          continue
        }
      }

      cursorStrip = walkStrip
      cursorIndex = walkIndex
    } else {
      // Traverse left
      const walkStrip = cursorStrip.leftStep!
      const walkDiff = walkStrip.fragmentDiff ?? walkStrip.insertionDiff
      const walkIndex = cursorIndex - walkDiff
      const walkDistance = Math.abs(walkIndex - index)

      let leftJump = cursorStrip.leftJump

      if (leftJump) {
        let leftJumpFrameCount = cursorStrip.leftJumpFrameCount!
        let leftJumpStripCount = cursorStrip.leftJumpStripCount!

        if (leftJumpStripCount < optimalJumpSpacing && leftJump !== this.head) {
          const nextLeftJump = leftJump.leftJump

          if (
            nextLeftJump &&
            leftJump.leftJumpStripCount! <=
              optimalJumpSpacing - leftJumpStripCount
          ) {
            leftJumpFrameCount += leftJump.leftJumpFrameCount!
            leftJumpStripCount += leftJump.leftJumpStripCount!

            cursorStrip.leftJump = nextLeftJump
            cursorStrip.leftJumpFrameCount = leftJumpFrameCount
            cursorStrip.leftJumpStripCount = leftJumpStripCount

            nextLeftJump.rightJump = cursorStrip
            nextLeftJump.rightJumpFrameCount = leftJumpFrameCount
            nextLeftJump.rightJumpStripCount = leftJumpStripCount

            leftJump.leftJump = undefined
            leftJump.rightJump = undefined

            leftJump = nextLeftJump
          }
        }

        const jumpIndex = cursorIndex - leftJumpFrameCount

        if (jumpIndex <= index && index <= cursorIndex) {
          leftJumpToPatch = leftJump
          rightJumpToPatch = cursorStrip
        }

        const jumpDistance = Math.abs(jumpIndex - index)

        if (jumpDistance < currentDistance && jumpDistance < walkDistance) {
          cursorStrip = leftJump
          cursorIndex = jumpIndex
          continue
        }
      }

      cursorStrip = walkStrip
      cursorIndex = walkIndex
    }
  }
}
