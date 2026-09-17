# Hostile three-peer delivery

Three peers begin from the same empty Sequence and independently produce a
mixture of inserts, removes, and equal-length replacements. Every resulting
Gossip update is delivered to fresh receivers both chronologically and in the
deterministic mixed order reported by the generative stress test.
The fixture fixes and exhausts all relative orderings of the three peers'
increase and decrease Session IDs, so the guarantee is not dependent on
randomly generated clocks.

The delivery order changes whether a mask or its concurrent insertion is seen
first. It must not change `projectionFrameCount`, and every projection position must
resolve to the same footage on both receivers.
