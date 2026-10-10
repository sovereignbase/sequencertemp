# Safe local anchor selection

A local insertion must use an available canonical anchor point. At an already
reserved boundary, it anchors to the end of the insertion using that boundary.
A fragment boundary remains reserved after its occupying insertion is removed.
The removal mask supplies a free end; an unrelated preceding visible Frame
does not identify that reservation.

The regression builds `a b x c`, removes `b`, and replaces `x` with `y`.
The result must be `a y c`, with the replacement anchored at the removal mask's end.
The tests verify the published anchor and indexed values, both locally and
after immediate Gossip delivery with acknowledgement replies.
