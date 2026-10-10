import type { Projection } from '../class.js'
import type { Strip } from '../types/type.js'
import { linkJumps } from './linkJumps.js'

/**
 * Resolves a materialized Strip's first Projection position and updates jumps.
 *
 * @param this Projection containing the Strip.
 * @param strip Strip whose visible position is required.
 * @param gateDiff Visible edit effect preceding the retained gate.
 * @returns First Projection position of the Strip.
 */
export function findProjectionPositionOfStrip<T>(
  this: Projection<T>,
  strip: NonNullable<Strip<T>>,
  gateDiff = 0
): number {
  // Both directions start at the edited Strip and advance within the same iteration;
  // whichever reaches a known visible reference first can determine the index.
  let leftCursor: NonNullable<Strip<T>> = strip
  let rightCursor: NonNullable<Strip<T>> = strip

  // Left distance counts visible Frames before strip; right distance counts from strip
  // to the right cursor. Structural counts include hidden nodes independently.
  let leftFrameDistance = 0
  let rightFrameDistance = 0

  let leftStripDistance = 0
  let rightStripDistance = 0

  // Remember candidates exactly one target spacing away when a longer gap needs to be split.
  let leftJump: Strip<T>
  let rightJump: Strip<T>

  let leftJumpedDistance = 0
  let rightJumpedDistance = 0

  // Reuse gatePosition directly only for the unchanged gate with no visible edit effect.
  let knownIndex =
    gateDiff === 0 && strip === this.gate ? this.gatePosition : undefined

  const optimalJumpSpacing = Math.round(Math.sqrt(this.structuralStripCount))

  // FIND NEAREST LEFT AND RIGHT JUMPS
  // An existing jump makes strip a ready traversal anchor; no neighbor search is needed on that side.
  const jumpAnchor = !!(strip.leftJump || strip.rightJump)

  // A structural edge also ends the initial search because there is no farther neighbor.
  let leftJumpFound = jumpAnchor || !leftCursor.leftStep

  let rightJumpFound = jumpAnchor || !rightCursor.rightStep

  // Each unfinished side advances one step; a side with a reference stays put while the other catches up.
  while (!leftJumpFound || !rightJumpFound) {
    if (!leftJumpFound) {
      // The unfinished-left condition guarantees a predecessor; count its positive length after entering it.
      leftCursor = leftCursor.leftStep!

      const leftDiff = leftCursor.fragmentDiff ?? leftCursor.insertionDiff
      leftFrameDistance += Math.max(0, leftDiff)

      ++leftStripDistance

      // The old gate lies before this edit, so its cached start plus intervening Frames locates strip.
      if (leftCursor === this.gate) {
        knownIndex = this.gatePosition + leftFrameDistance
      }

      // Save the exact spacing candidate without an extra walk if this gap later requires two jumps.
      if (leftStripDistance === optimalJumpSpacing) {
        leftJump = leftCursor
        leftJumpedDistance = leftFrameDistance
      }

      leftJumpFound =
        // Visible boundaries supply known indices even beside hidden history; structural edges
        // and existing jump endpoints also bound the initial local gap.
        leftCursor === this.head || leftCursor === this.tail ||
        !leftCursor.leftStep ||
        !!leftCursor.rightJump ||
        !!leftCursor.leftJump
    }

    if (!rightJumpFound) {
      const rightDiff = rightCursor.fragmentDiff ?? rightCursor.insertionDiff
      // Moving right counts the Strip being left; masks contribute zero visible distance.
      rightFrameDistance += Math.max(0, rightDiff)

      rightCursor = rightCursor.rightStep!
      ++rightStripDistance

      // The gate is after the edit: shift its previous start by gateDiff before subtracting the traversed span.
      if (rightCursor === this.gate) {
        knownIndex = this.gatePosition + gateDiff - rightFrameDistance
      }

      // Save the symmetric candidate for splitting an overlong right-side gap.
      if (rightStripDistance === optimalJumpSpacing) {
        rightJump = rightCursor
        rightJumpedDistance = rightFrameDistance
      }

      rightJumpFound =
        // Stop at a known visible boundary, structural end, or existing jump anchor.
        rightCursor === this.head || rightCursor === this.tail ||
        !rightCursor.rightStep ||
        !!rightCursor.leftJump ||
        !!rightCursor.rightJump
    }
  }

  // CREATE JUMPS TOWARDS OPTIMAL SPACING
  // The resolved edit must delimit its own spans even in a short gap.
  if (!strip.leftJump && !strip.rightJump) {
    // Never create a self-jump; the left side must have a distinct endpoint.
    if (leftCursor !== strip) {
      // At least two target spacings justify using the recorded intermediate anchor;
      // subtract its measured distance to obtain the remaining span without another walk.
      if (leftStripDistance >= optimalJumpSpacing * 2) {
        linkJumps(
          leftCursor,
          leftJump!,
          leftFrameDistance - leftJumpedDistance,
          leftStripDistance - optimalJumpSpacing
        )

        linkJumps(leftJump!, strip, leftJumpedDistance, optimalJumpSpacing)
      } else {
        linkJumps(leftCursor, strip, leftFrameDistance, leftStripDistance)
      }
    }

    // The same non-self constraint applies on the right side.
    if (rightCursor !== strip) {
      // Split a sufficiently long right gap into the recorded spacing and the remaining distance.
      if (rightStripDistance >= optimalJumpSpacing * 2) {
        linkJumps(strip, rightJump!, rightJumpedDistance, optimalJumpSpacing)

        linkJumps(
          rightJump!,
          rightCursor,
          rightFrameDistance - rightJumpedDistance,
          rightStripDistance - optimalJumpSpacing
        )
      } else {
        linkJumps(strip, rightCursor, rightFrameDistance, rightStripDistance)
      }
    }
  }

  // Cache the span of this resolved edit; apply restores the retained local gate's outgoing span.
  this.leftJumpToPatch = strip
  this.rightJumpToPatch = strip.rightJump

  // If strip precedes the known first visible Strip, no visible Frames precede its start.
  if (rightCursor === this.head && strip !== this.head) return 0
  // A Strip following the previous visible tail starts at updated length minus its own positive effect.
  if (leftCursor === this.tail && strip !== this.tail)
    return this.projectionFrameCount - Math.max(0, strip.fragmentDiff ?? strip.insertionDiff)

  // A cached index of zero is valid; test against undefined rather than truthiness.
  if (knownIndex !== undefined) {
    return knownIndex
  }

  while (true) {
    // Head begins at zero; adding the measured left span gives strip's index.
    if (leftCursor === this.head) return leftFrameDistance
    // A right cursor reaching head places strip within the hidden prefix at index zero.
    if (rightCursor === this.head) return 0
    // Once the left search reaches tail, strip's positive effect is the only visible suffix to subtract.
    if (leftCursor === this.tail)
      return this.projectionFrameCount - Math.max(0, strip.fragmentDiff ?? strip.insertionDiff)
    // Tail's first index is length minus its own positive length; subtract the measured
    // right span to recover strip's first index.
    if (rightCursor === this.tail)
      return this.projectionFrameCount - Math.max(0, rightCursor.fragmentDiff ?? rightCursor.insertionDiff) - rightFrameDistance
    // CHECK IF LEFT IS AT STRUCTURAL START
    // A structural start also has visible index zero, even when hidden nodes precede head.
    if (!leftCursor.leftStep) {
      return leftFrameDistance
    }

    // CHECK IF RIGHT IS AT STRUCTURAL END
    // At structural end, exclude the endpoint's positive length and all Frames counted to its left.
    if (!rightCursor.rightStep) {
      const rightDiff = rightCursor.fragmentDiff ?? rightCursor.insertionDiff
      return (
        this.projectionFrameCount - Math.max(0, rightDiff) - rightFrameDistance
      )
    }

    // USE LEFT JUMP IF AVAILABLE
    const leftJump = leftCursor.leftJump

    if (leftJump) {
      let leftJumpFrameCount = leftCursor.leftJumpFrameCount!

      let leftJumpStripCount = leftCursor.leftJumpStripCount!

      // REMOVE A JUMP INDEX FROM BETWEEN TO INCREASE DISTANCE TOWARDS OPTIMAL
      // Preserve head, tail, and the retained local gate as jump endpoints.
      if (
        leftJumpStripCount < optimalJumpSpacing &&
        leftJump !== this.head &&
        leftJump !== this.tail &&
        leftJump !== this.gate
      ) {
        const nextLeftJump = leftJump.leftJump

        if (
          nextLeftJump &&
          // The extra structural span must fit the remaining spacing budget before bypassing its endpoint.
          leftJump.leftJumpStripCount! <=
            optimalJumpSpacing - leftJumpStripCount
        ) {
          leftJumpFrameCount += leftJump.leftJumpFrameCount!

          leftJumpStripCount += leftJump.leftJumpStripCount!

          // Reconnect both ends with summed distances before detaching the intermediate anchor.
          linkJumps(nextLeftJump, leftCursor, leftJumpFrameCount, leftJumpStripCount)

          leftCursor = nextLeftJump
        } else {
          leftCursor = leftJump
        }
      } else {
        leftCursor = leftJump
      }

      // The cached span counts only positive visible Frames; no negative effect is consumed a second time.
      leftFrameDistance += leftJumpFrameCount
    } else {
      // Without a jump, advance one predecessor and count the positive Frames in the node entered.
      leftCursor = leftCursor.leftStep!

      const leftDiff = leftCursor.fragmentDiff ?? leftCursor.insertionDiff
      leftFrameDistance += Math.max(0, leftDiff)
    }

    // USE RIGHT JUMP IF AVAILABLE
    const rightJump = rightCursor.rightJump

    if (rightJump) {
      let rightJumpFrameCount = rightCursor.rightJumpFrameCount!

      let rightJumpStripCount = rightCursor.rightJumpStripCount!

      // REMOVE A JUMP INDEX FROM BETWEEN TO INCREASE DISTANCE TOWARDS OPTIMAL
      // Keep the visible boundaries and the retained local gate as jump endpoints.
      if (
        rightJumpStripCount < optimalJumpSpacing &&
        rightJump !== this.tail &&
        rightJump !== this.head &&
        rightJump !== this.gate
      ) {
        const nextRightJump = rightJump.rightJump

        if (
          nextRightJump &&
          // Only merge when the next span fits the remaining structural spacing budget.
          rightJump.rightJumpStripCount! <=
            optimalJumpSpacing - rightJumpStripCount
        ) {
          rightJumpFrameCount += rightJump.rightJumpFrameCount!

          rightJumpStripCount += rightJump.rightJumpStripCount!

          // Install matching forward and reverse counts before clearing both links of the bypassed anchor.
          linkJumps(rightCursor, nextRightJump, rightJumpFrameCount, rightJumpStripCount)

          rightCursor = nextRightJump
        } else {
          rightCursor = rightJump
        }
      } else {
        rightCursor = rightJump
      }

      // Accumulate the same nonnegative visible span used by leftward traversal.
      rightFrameDistance += rightJumpFrameCount
    } else {
      const rightDiff = rightCursor.fragmentDiff ?? rightCursor.insertionDiff
      // Without a jump, count the current node's visible Frames before stepping to its successor.
      rightFrameDistance += Math.max(0, rightDiff)

      rightCursor = rightCursor.rightStep!
    }
  }
}
