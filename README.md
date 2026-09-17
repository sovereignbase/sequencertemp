# Sequencertemp

> [!NOTE]
> This was a temporary repository used to establish and refine clear invariants for [Sequencer](https://github.com/sovereignbase/sequencer) and is now archived.

Understanding how it works is pretty easy. There are a few key concepts.

## Sequence

The `Sequence` is the structural order of insertions.

Every insertion initially grows the Sequence. Insertions remain in Structural Order while they are required to preserve ordering and deletion semantics.

Once a deletion has been acknowledged by all participating Actors, the corresponding structural information is no longer required for convergence and can be compacted from the Sequence.

The position of each insertion is described using stable logical coordinates so the same insertion can be applied commutatively and idempotently by every replica.

## Projection

The `Projection` is the applied presentation of a Sequence.

In other words a Sequence is used to derive a Projection.

Applications using Sequencer work entirely in Projection positions. The Sequencer translates those positions into commutative descriptions of points in Sequence.

## Insertion

An insertion contains a commutative description of its position in Sequence, together with the logical range and Projection effect of the insertion itself.

Its position is described by:

`(anchorSession, anchorStart, anchorDiff)`

which identifies the exact logical point in Sequence after which the insertion belongs.

The insertion itself is identified within its Session by:

`(insertionSession, insertionStart)`

and `insertionDiff` describes its signed Frame length and effect on the Projection.

An insertion therefore contains:

- `anchorSession` — `insertionSession` of the anchoring insertion.
- `anchorStart` — `insertionStart` of the anchoring insertion.
- `anchorDiff` — Difference from the anchoring insertion's `insertionStart` towards its `insertionEnd`, identifying the exact anchor point as `anchorStart + anchorDiff`.
- `insertionSession` — Number identifying the Session that sequenced this insertion.
- `insertionStart` — Numerical point identifying this insertion within a Session's logical time space.
- `insertionDiff` — Signed Frame length of this insertion and its effect on the Projection.
- `footage?` — Optional Footage carried by a positive insertion.

## Choosing an anchor

A local insertion first converts its Projection position into a stable anchor in Sequence.

The anchor is stored as:

`(anchorSession, anchorStart, anchorDiff)`

where `anchorDiff` is always expressed in the coordinate space of the **original anchoring insertion**, regardless of how that insertion has since been fragmented.

For a non-empty Projection:

1. At the tail, the anchor is the final Frame of the tail Strip.
2. Otherwise, the Frame at the requested Projection position is located and its containing Strip becomes the initial anchoring Strip.
3. If the anchor falls exactly on the right boundary of that Strip and another Strip follows it, the same boundary is represented from the right:

   - the right Strip becomes the anchoring Strip;
   - its local anchor position becomes `0`.

4. `findFrame()` converts that Strip-local position into the stable `anchorDiff` of the original insertion.

A Strip-local position of `0` therefore represents its left boundary. For an original Strip this is `anchorDiff = 0`, the insertion's **zero-reservation**. For a right fragment, `findFrame()` maps that local boundary back to the corresponding logical difference within the original insertion.

The first insertion into an empty Projection is anchored to the root sentinel `(0, 0, 0)`.

## Anchoring an insertion

Once the anchor has been chosen, every Strip is structurally inserted through the same `anchorStrip()` operation.

The operation receives:

- the incoming Strip;
- the anchoring Strip;
- the anchor position within that Strip.

First, the anchor boundary is materialized.

- If the anchor is already at the end of the anchoring Strip, no split is required.
- If the anchor lies inside the anchoring Strip, the Strip is split at the anchor position. The existing Strip becomes the left fragment ending at the anchor, while the new right fragment contains the Frames after the anchor.
- The incoming Strip is then inserted between these two sides of the boundary.

If the Strip on the right is anchored to the same `(anchorSession, anchorStart, anchorDiff)`, the insertions overlap. The competitor chain is traversed according to the overlap ordering rules, and `subtreeEnd()` is used when the insertion must be placed after an existing competitor's causal subtree.

## Overlap handling

Two insertions are competitors when they resolve to the same anchor:

`(anchorSession, anchorStart, anchorDiff)`

Competitors are ordered deterministically using the following rules:

1. **Positive insertions come before negative insertions.**

2. **Between insertions with the same sign, the greater `insertionSession` comes first.**

3. **Within the same Session, an insertion that starts after the previous insertion's reserved logical range comes after it.**

   In other words, the existing competitor comes first when:

   `incoming.insertionStart >= existing.insertionStart + |existing.insertionDiff| + 1`

These rules define the competitor order independently of arrival order.

When an incoming Strip belongs after an existing competitor, it is not inserted directly after that Strip. It is inserted after the competitor's entire causal subtree, resolved by `subtreeEnd()`.

So structurally the rule is:

`competitor ordering → preserve causal subtree → insert at resolved boundary`

The resulting order is deterministic across replicas even when competing insertions are received in different orders.
