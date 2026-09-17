# Hostile three-peer delivery

Three peers begin from the same empty Snapshot and independently produce a
mixture of inserts, removes, and equal-length replacements. Every resulting
Gossip update is delivered to fresh receivers both chronologically and in the
deterministic mixed order reported by the generative stress test.

The delivery order changes whether a mask or its concurrent insertion is seen
first. It must not change `visibleFrameCount`, and every visible index must
resolve to the same footage on both receivers.
