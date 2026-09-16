# Concurrent replacement delivery

Three replicas edit the same five-frame base independently. Their workload
contains inserts, removes, and several replacements that mask overlapping
original Frames. Every Gossip packet is delivered to a fresh live replica.

The chronological and deterministic mixed deliveries must expose the same
`visibleFrameCount` and return the same Footage from every visible index. In
particular, delivery order cannot choose which concurrent replacement remains
visible at the final original-frame boundary.
