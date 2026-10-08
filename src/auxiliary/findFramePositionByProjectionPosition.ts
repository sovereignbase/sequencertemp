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
 * Footage array shared by all fragments of that insertion. In insertion mode,
 * a nonzero fragment-start boundary resolves to the preceding visible Frame's
 * right logical anchor point instead.
 *
 * @param this Projection containing the requested position.
 * @param index Valid visible Projection position to resolve.
 * @param forInsertion Whether to resolve an insertion boundary; defaults to false.
 * @returns Original Footage Frame position, or a logical anchor point in insertion mode.
 */
export function findFramePositionByProjectionPosition<T>(
  this: Projection<T>,
  index: number,
  forInsertion = false
): number {
  // Insertion mode may resolve the preceding visible Frame once, then return its right logical point.
  let after = false
  // Use gate as the default traverse start node.
  let cursorStrip: NonNullable<Strip<T>> = (this.gate ?? this.head)!
  // Track the Strip's visible start separately from its original Footage offset.
  let cursorIndex: number = this.gatePosition

  // Carry the known crossing span until traversal selects or leaves a more relevant jump.
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
    // Allow a tie with tail after requiring a strict improvement over gate; head's start is already index zero.
    index <= tailDistance
  ) {
    cursorStrip = this.head!
    cursorIndex = 0

    leftJumpToPatch = cursorStrip
    rightJumpToPatch = cursorStrip.rightJump
  } else if (
    // Distance to travel from tail to requested projection position is shorter than distance from gate.
    // A strict comparison keeps the existing gate when tail offers no distance improvement.
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
    // Visible Frame intervals are half-open: an index at the right end belongs to a later Strip.
    // A zero-length node cannot satisfy this condition and is traversed structurally instead.
    if (cursorIndex <= index && index < cursorIndex + stripLength) {
      // Only insertion mode at a nonzero fragment-start boundary uses the preceding Frame.
      // The after flag prevents repeating the adjustment; index > 0 ensures that Frame exists.
      if (forInsertion && !after && index > 0 && index === cursorIndex && cursorStrip.fragmentStart !== undefined) {
        // Continue the same traversal toward the preceding visible Frame rather than performing a second lookup.
        --index
        // The returned original offset will add one to select this preceding Frame's right anchor point.
        after = true
        continue
      }
      // If cursor strip was left jump to patch (see below).
      // Adopt the resolved Strip's outgoing span only when no crossing pair was already selected.
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

      // Adding the original fragment offset preserves Footage coordinates despite removed visible prefixes.
      const fragmentStart = cursorStrip.fragmentStart
      // Original Footage position, or the following logical point in insertion mode.
      return (fragmentStart ?? 0) + index - cursorIndex + (after ? 1 : 0)
    }

    // Absolute distance from cursor to requested projection position.
    const currentDistance = Math.abs(cursorIndex - index)

    // Containment failed above, so the target is at or beyond this Strip's visible right boundary.
    if (cursorIndex <= index) {
      // Traverse right
      const walkStrip = cursorStrip.rightStep!
      // Moving right crosses the current Strip's visible length; hidden nodes change only the structural cursor.
      const walkIndex = cursorIndex + stripLength
      const walkDistance = Math.abs(walkIndex - index)

      let rightJump = cursorStrip.rightJump

      // Require a jump and a nonnegative source position before using its cached visible distance.
      if (rightJump && cursorIndex >= 0) {
        let rightJumpFrameCount = cursorStrip.rightJumpFrameCount!
        let rightJumpStripCount = cursorStrip.rightJumpStripCount!

        if (
          // A short jump may be combined with its successor, but head and tail remain explicit
          // endpoints because their visible positions are known without further traversal.
          rightJumpStripCount < optimalJumpSpacing &&
          rightJump !== this.head &&
          rightJump !== this.tail
        ) {
          const nextRightJump = rightJump.rightJump

          if (
            nextRightJump &&
            // Combine only when both structural spans fit within the current spacing target.
            rightJump.rightJumpStripCount! <=
              optimalJumpSpacing - rightJumpStripCount
          ) {
            rightJumpFrameCount += rightJump.rightJumpFrameCount!
            rightJumpStripCount += rightJump.rightJumpStripCount!

            // Bypass the intermediate jump anchor and give both surviving endpoints identical summed distances.
            cursorStrip.rightJump = nextRightJump
            cursorStrip.rightJumpFrameCount = rightJumpFrameCount
            cursorStrip.rightJumpStripCount = rightJumpStripCount

            nextRightJump.leftJump = cursorStrip
            nextRightJump.leftJumpFrameCount = rightJumpFrameCount
            nextRightJump.leftJumpStripCount = rightJumpStripCount

            // The bypassed anchor must lose both old reciprocal links, leaving no obsolete traversal shortcut.
            rightJump.leftJump = undefined
            rightJump.rightJump = undefined

            rightJump = nextRightJump
          }
        }

        const jumpIndex = cursorIndex + rightJumpFrameCount

        // Cache the span containing the edit boundary, including its endpoints, for later distance patching.
        if (cursorIndex <= index && index <= jumpIndex) {
          leftJumpToPatch = cursorStrip
          rightJumpToPatch = rightJump
        }

        const jumpDistance = Math.abs(jumpIndex - index)

        if (
          // A right jump must not pass the target and must beat both staying here and taking one step.
          jumpIndex <= index &&
          jumpDistance < currentDistance &&
          jumpDistance < walkDistance
        ) {
          // Advance both cursor and known visible start together; the next iteration tests the destination.
          cursorStrip = rightJump
          cursorIndex = jumpIndex
          continue
        }
      }

      // While stepping through a jump's interior, retain its endpoints as the possible edit-spanning pair.
      if (rightJump) {
        leftJumpToPatch = cursorStrip
        rightJumpToPatch = rightJump
      }

      cursorStrip = walkStrip
      cursorIndex = walkIndex

      // Reaching the right endpoint leaves this span's interior; clear it before resolving another span.
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
      // Moving left crosses the predecessor's positive length, not the current Strip's length.
      const walkIndex = cursorIndex - walkLength
      const walkDistance = Math.abs(walkIndex - index)

      let leftJump = cursorStrip.leftJump

      if (leftJump) {
        let leftJumpFrameCount = cursorStrip.leftJumpFrameCount!
        let leftJumpStripCount = cursorStrip.leftJumpStripCount!

        // As on the right, merge only short spans and preserve the visible head and tail anchors.
        if (leftJumpStripCount < optimalJumpSpacing && leftJump !== this.head && leftJump !== this.tail) {
          const nextLeftJump = leftJump.leftJump

          if (
            nextLeftJump &&
            // The preceding span must fit the remaining structural spacing budget before it can be combined.
            leftJump.leftJumpStripCount! <=
              optimalJumpSpacing - leftJumpStripCount
          ) {
            leftJumpFrameCount += leftJump.leftJumpFrameCount!
            leftJumpStripCount += leftJump.leftJumpStripCount!

            // The summed left jump and its reverse must describe the same Frame and Strip distances.
            cursorStrip.leftJump = nextLeftJump
            cursorStrip.leftJumpFrameCount = leftJumpFrameCount
            cursorStrip.leftJumpStripCount = leftJumpStripCount

            nextLeftJump.rightJump = cursorStrip
            nextLeftJump.rightJumpFrameCount = leftJumpFrameCount
            nextLeftJump.rightJumpStripCount = leftJumpStripCount

            // Detach both links on the intermediate anchor after redirecting the surviving endpoints.
            leftJump.leftJump = undefined
            leftJump.rightJump = undefined

            leftJump = nextLeftJump
          }
        }

        const jumpIndex = cursorIndex - leftJumpFrameCount

        // The requested boundary lies within this leftward span, so it may need local edit patching.
        if (jumpIndex <= index && index <= cursorIndex) {
          leftJumpToPatch = leftJump
          rightJumpToPatch = cursorStrip
        }

        const jumpDistance = Math.abs(jumpIndex - index)

        if (
          // A left jump may land at or to the right of the target, and only if it improves on the single step.
          index <= jumpIndex &&
          jumpDistance < currentDistance &&
          jumpDistance < walkDistance
        ) {
          // Move the cursor and visible start by the same cached span; no original Frame coordinates change.
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

      // At the left endpoint the old crossing span is exhausted and must not be patched for a later position.
      if (cursorStrip === leftJumpToPatch) {
        leftJumpToPatch = undefined
        rightJumpToPatch = undefined
      }
    }
  }
}
