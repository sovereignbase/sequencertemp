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

  const tailDiff = this.tail!.fragmentDiff ?? this.tail!.insertionDiff
  const tailIndex = this.visibleFrameCount - tailDiff
  const tailPredecessorDiff =
    this.tail!.leftStep?.fragmentDiff ?? this.tail!.leftStep?.insertionDiff ?? 0

  const distanceToTravel = Math.abs(this.visibleIndex - index)
  const tailDistance = Math.abs(tailIndex - index)

  if (
    tailPredecessorDiff < 0 ||
    (index < distanceToTravel && index <= tailDistance)
  ) {
    cursorStrip = this.head!
    cursorIndex = 0

    leftJumpToPatch = cursorStrip
    rightJumpToPatch = cursorStrip.rightJump
  } else if (tailPredecessorDiff >= 0 && tailDistance < distanceToTravel) {
    cursorStrip = this.tail!
    cursorIndex = tailIndex

    leftJumpToPatch = cursorStrip.leftJump
    rightJumpToPatch = cursorStrip
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

      if (tailPredecessorDiff >= 0 && rightJump && cursorIndex >= 0) {
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

        if (
          jumpIndex <= index &&
          jumpDistance < currentDistance &&
          jumpDistance < walkDistance
        ) {
          cursorStrip = rightJump
          cursorIndex = jumpIndex
          continue
        }
      }

      if (rightJump) {
        leftJumpToPatch = cursorStrip
        rightJumpToPatch = rightJump
      }

      cursorStrip = walkStrip
      cursorIndex = walkIndex

      if (cursorStrip === rightJumpToPatch) {
        leftJumpToPatch = undefined
        rightJumpToPatch = undefined
      }
    } else {
      // Traverse left
      const walkStrip = cursorStrip.leftStep!
      const walkDiff = walkStrip.fragmentDiff ?? walkStrip.insertionDiff
      const walkIndex = cursorIndex - walkDiff
      const walkDistance = Math.abs(walkIndex - index)

      let leftJump = cursorStrip.leftJump

      if (tailPredecessorDiff >= 0 && leftJump) {
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

        if (
          index <= jumpIndex &&
          jumpDistance < currentDistance &&
          jumpDistance < walkDistance
        ) {
          cursorStrip = leftJump
          cursorIndex = jumpIndex
          continue
        }
      }

      if (leftJump) {
        leftJumpToPatch = leftJump
        rightJumpToPatch = cursorStrip
      }

      cursorStrip = walkStrip
      cursorIndex = walkIndex

      if (cursorStrip === leftJumpToPatch) {
        leftJumpToPatch = undefined
        rightJumpToPatch = undefined
      }
    }
  }
}
