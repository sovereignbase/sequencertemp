import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'

export function findProjectionPositionOfStrip<T>(
  this: Projection<T>,
  strip: NonNullable<Strip<T>>,
  gateDiff = 0
): number {
  let leftCursor: NonNullable<Strip<T>> = strip
  let rightCursor: NonNullable<Strip<T>> = strip

  let leftDistance = 0
  let rightDistance = 0

  let leftStripDistance = 0
  let rightStripDistance = 0

  let leftSplit: Strip<T>
  let rightSplit: Strip<T>

  let leftSplitDistance = 0
  let rightSplitDistance = 0

  let knownIndex =
    gateDiff === 0 && strip === this.gate ? this.projectedPosition : undefined

  const optimalJumpSpacing = Math.round(Math.sqrt(this.structuralStripCount))

  // FIND NEAREST LEFT AND RIGHT JUMPS
  const jumpAnchor = !!(strip.leftJump || strip.rightJump)

  let leftJumpFound = jumpAnchor || leftCursor === this.head

  let rightJumpFound = jumpAnchor || rightCursor === this.tail

  while (!leftJumpFound || !rightJumpFound) {
    if (!leftJumpFound) {
      leftCursor = leftCursor.leftStep!

      const leftDiff = leftCursor.fragmentDiff ?? leftCursor.insertionDiff
      leftDistance += Math.max(0, leftDiff)

      ++leftStripDistance

      if (leftCursor === this.gate) {
        knownIndex = this.projectedPosition + leftDistance
      }

      if (leftStripDistance === optimalJumpSpacing) {
        leftSplit = leftCursor
        leftSplitDistance = leftDistance
      }

      leftJumpFound =
        leftCursor === this.head ||
        !!leftCursor.rightJump ||
        !!leftCursor.leftJump
    }

    if (!rightJumpFound) {
      const rightDiff = rightCursor.fragmentDiff ?? rightCursor.insertionDiff
      rightDistance += Math.max(0, rightDiff)

      rightCursor = rightCursor.rightStep!
      ++rightStripDistance

      if (rightCursor === this.gate) {
        this.projectedPosition += gateDiff
        knownIndex = this.projectedPosition - rightDistance
      }

      if (rightStripDistance === optimalJumpSpacing) {
        rightSplit = rightCursor
        rightSplitDistance = rightDistance
      }

      rightJumpFound =
        rightCursor === this.tail ||
        !!rightCursor.leftJump ||
        !!rightCursor.rightJump
    }
  }

  // Patch jumps affected by remote apply.
  if (rightCursor !== strip && leftCursor.rightJump === rightCursor) {
    const frameCount = leftDistance + rightDistance
    const stripCount = leftStripDistance + rightStripDistance

    leftCursor.rightJumpFrameCount = frameCount
    leftCursor.rightJumpStripCount = stripCount
    rightCursor.leftJumpFrameCount = frameCount
    rightCursor.leftJumpStripCount = stripCount
  }

  // CREATE JUMPS TOWARDS OPTIMAL SPACING
  if (
    !strip.leftJump &&
    !strip.rightJump &&
    (leftStripDistance >= optimalJumpSpacing ||
      rightStripDistance >= optimalJumpSpacing)
  ) {
    const link = (
      left: NonNullable<Strip<T>>,
      right: NonNullable<Strip<T>>,
      frames: number,
      strips: number
    ) => {
      if (left.rightJump && left.rightJump !== right)
        left.rightJump.leftJump = undefined

      if (right.leftJump && right.leftJump !== left)
        right.leftJump.rightJump = undefined

      left.rightJump = right
      left.rightJumpFrameCount = frames
      left.rightJumpStripCount = strips

      right.leftJump = left
      right.leftJumpFrameCount = frames
      right.leftJumpStripCount = strips
    }

    if (leftCursor !== strip) {
      if (leftStripDistance >= optimalJumpSpacing * 2) {
        link(
          leftCursor,
          leftSplit!,
          leftDistance - leftSplitDistance,
          leftStripDistance - optimalJumpSpacing
        )

        link(leftSplit!, strip, leftSplitDistance, optimalJumpSpacing)
      } else {
        link(leftCursor, strip, leftDistance, leftStripDistance)
      }
    }

    if (rightCursor !== strip) {
      if (rightStripDistance >= optimalJumpSpacing * 2) {
        link(strip, rightSplit!, rightSplitDistance, optimalJumpSpacing)

        link(
          rightSplit!,
          rightCursor,
          rightDistance - rightSplitDistance,
          rightStripDistance - optimalJumpSpacing
        )
      } else {
        link(strip, rightCursor, rightDistance, rightStripDistance)
      }
    }
  }

  if (knownIndex !== undefined) {
    return knownIndex
  }

  while (true) {
    // CHECK IF LEFT IS AT HEAD
    if (leftCursor === this.head) {
      if (
        strip !== this.gate &&
        this.gate !== this.head &&
        (leftDistance < this.projectedPosition ||
          (leftDistance === this.projectedPosition &&
            (this.gate!.fragmentDiff ?? this.gate!.insertionDiff) >= 0))
      )
        this.projectedPosition += gateDiff

      return leftDistance
    }

    // CHECK IF RIGHT IS AT TAIL
    if (rightCursor === this.tail) {
      const rightDiff = rightCursor.fragmentDiff ?? rightCursor.insertionDiff
      const index =
        this.projectionFrameCount - Math.max(0, rightDiff) - rightDistance

      if (
        strip !== this.gate &&
        this.gate !== this.head &&
        (index < this.projectedPosition ||
          (index === this.projectedPosition &&
            (this.gate!.fragmentDiff ?? this.gate!.insertionDiff) >= 0))
      )
        this.projectedPosition += gateDiff

      return index
    }

    // USE LEFT JUMP IF AVAILABLE
    const leftJump = leftCursor.leftJump

    if (leftJump) {
      let leftJumpFrameCount = leftCursor.leftJumpFrameCount!

      let leftJumpStripCount = leftCursor.leftJumpStripCount!

      // REMOVE A JUMP INDEX FROM BETWEEN TO INCREASE DISTANCE TOWARDS OPTIMAL
      if (leftJumpStripCount < optimalJumpSpacing && leftJump !== this.head) {
        const nextLeftJump = leftJump.leftJump

        if (
          nextLeftJump &&
          leftJump.leftJumpStripCount! <=
            optimalJumpSpacing - leftJumpStripCount
        ) {
          leftJumpFrameCount += leftJump.leftJumpFrameCount!

          leftJumpStripCount += leftJump.leftJumpStripCount!

          leftCursor.leftJump = nextLeftJump
          leftCursor.leftJumpFrameCount = leftJumpFrameCount
          leftCursor.leftJumpStripCount = leftJumpStripCount

          nextLeftJump.rightJump = leftCursor
          nextLeftJump.rightJumpFrameCount = leftJumpFrameCount
          nextLeftJump.rightJumpStripCount = leftJumpStripCount

          leftJump.leftJump = undefined
          leftJump.rightJump = undefined

          leftCursor = nextLeftJump
        } else {
          leftCursor = leftJump
        }
      } else {
        leftCursor = leftJump
      }

      leftDistance += leftJumpFrameCount
    } else {
      leftCursor = leftCursor.leftStep!

      const leftDiff = leftCursor.fragmentDiff ?? leftCursor.insertionDiff
      leftDistance += Math.max(0, leftDiff)
    }

    // USE RIGHT JUMP IF AVAILABLE
    const rightJump = rightCursor.rightJump

    if (rightJump) {
      let rightJumpFrameCount = rightCursor.rightJumpFrameCount!

      let rightJumpStripCount = rightCursor.rightJumpStripCount!

      // REMOVE A JUMP INDEX FROM BETWEEN TO INCREASE DISTANCE TOWARDS OPTIMAL
      if (rightJumpStripCount < optimalJumpSpacing && rightJump !== this.tail) {
        const nextRightJump = rightJump.rightJump

        if (
          nextRightJump &&
          rightJump.rightJumpStripCount! <=
            optimalJumpSpacing - rightJumpStripCount
        ) {
          rightJumpFrameCount += rightJump.rightJumpFrameCount!

          rightJumpStripCount += rightJump.rightJumpStripCount!

          rightCursor.rightJump = nextRightJump
          rightCursor.rightJumpFrameCount = rightJumpFrameCount
          rightCursor.rightJumpStripCount = rightJumpStripCount

          nextRightJump.leftJump = rightCursor
          nextRightJump.leftJumpFrameCount = rightJumpFrameCount
          nextRightJump.leftJumpStripCount = rightJumpStripCount

          rightJump.leftJump = undefined
          rightJump.rightJump = undefined

          rightCursor = nextRightJump
        } else {
          rightCursor = rightJump
        }
      } else {
        rightCursor = rightJump
      }

      rightDistance += rightJumpFrameCount
    } else {
      const rightDiff = rightCursor.fragmentDiff ?? rightCursor.insertionDiff
      rightDistance += Math.max(0, rightDiff)

      rightCursor = rightCursor.rightStep!
    }
  }
}
