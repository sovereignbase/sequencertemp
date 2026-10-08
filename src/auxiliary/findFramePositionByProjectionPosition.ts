import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'

/**
 * Finds the Frame at a Projection position.
 *
 * Moves `gate` to the Strip or fragment containing `index` and updates
 * `projectedPosition` to that Strip's first Projection position.
 *
 * The returned Frame position is relative to the original insertion, not the
 * current fragment. It can therefore be used directly as an index into the
 * Footage array shared by all fragments of that insertion.
 *
 * @param this Projection containing the requested position.
 * @param index Projection position to resolve.
 * @returns Zero-based Frame position in the containing insertion's Footage.
 */
export function findFramePositionByProjectionPosition<T>(
  this: Projection<T>,
  index: number
): number {
  // Use gate as the default traverse start node.
  let cursorStrip: NonNullable<Strip<T>> = (this.gate ?? this.head)!
  let cursorIndex: number = this.gatePosition

  let leftJumpToPatch = this.leftJumpToPatch
  let rightJumpToPatch = this.rightJumpToPatch

  // Tail (strip | fragment) length.
  const tailDiff = this.tail!.fragmentDiff ?? this.tail!.insertionDiff
  // Index at the first frame of tail (strip | fragment).
  const tailIndex = this.projectionFrameCount - tailDiff
  // Length from tail to requested projection position.
  const tailDistance = Math.abs(tailIndex - index)

  // Length from gate to requested projection position.
  const gateDistance = Math.abs(this.gatePosition - index)

  if (
    // Distance to travel from head to requested projection position is shorter than distance from gate and tail.
    index < gateDistance &&
    index <= tailDistance
  ) {
    cursorStrip = this.head!
    cursorIndex = 0

    leftJumpToPatch = cursorStrip
    rightJumpToPatch = cursorStrip.rightJump
  } else if (
    // Distance to travel from tail to requested projection position is shorter than distance from gate.
    tailDistance < gateDistance
  ) {
    cursorStrip = this.tail!
    cursorIndex = tailIndex

    leftJumpToPatch = cursorStrip.leftJump
    rightJumpToPatch = cursorStrip
  }

  // Calculate optimal jump distance that allows for an average minimum strips traversed
  // (<= sqrt(structuralStripCount) * 2)
  const optimalJumpSpacing = Math.round(Math.sqrt(this.structuralStripCount))

  while (true) {
    // Length of the (strip | fragment) being traversed.
    const cursorDiff = cursorStrip.fragmentDiff ?? cursorStrip.insertionDiff
    // Negative strips do not consume length (already consumed on split).
    const stripLength = cursorDiff > 0 ? cursorDiff : 0

    // If cursor contains requested projection position.
    if (cursorIndex <= index && index < cursorIndex + stripLength) {
      // If cursor strip was left jump to patch (see below).
      if (!leftJumpToPatch && !rightJumpToPatch && cursorStrip.rightJump) {
        // Set patch points if missing and cursor has one to right.
        leftJumpToPatch = cursorStrip
        rightJumpToPatch = cursorStrip.rightJump
      }

      // Patch gate and projection position.
      this.gate = cursorStrip
      this.projectedPosition = cursorIndex
      this.gatePosition = cursorIndex

      // Set jumps to patch at top level.
      this.leftJumpToPatch = leftJumpToPatch
      this.rightJumpToPatch = rightJumpToPatch

      const fragmentStart = cursorStrip.fragmentStart
      // Return the Frame's position in the original insertion's Footage
      // Works, because projection positions do not land on 0 frame fragmentstart 0 positions.
      return (fragmentStart ?? 0) + index - cursorIndex
    }

    // Absolute distance from cursor to requested projection position.
    const currentDistance = Math.abs(cursorIndex - index)

    if (cursorIndex <= index) {
      // Traverse right
      const walkStrip = cursorStrip.rightStep!
      const walkIndex = cursorIndex + stripLength
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
      // Negative strips do not consume length (already consumed on split).
      const walkLength = walkDiff > 0 ? walkDiff : 0
      const walkIndex = cursorIndex - walkLength
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
