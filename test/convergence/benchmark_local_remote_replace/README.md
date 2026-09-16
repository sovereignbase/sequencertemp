# Benchmark local/remote replacement equivalence

Two continuously synchronized peers run the deterministic lifecycle benchmark
workload. Every local Gossip update is delivered immediately and every returned
acknowledgement is sent back before the next operation.

The author and receiver must expose the same `visibleFrameCount` after every
delivery and the same Footage at periodic checkpoints. In particular, applying
a replacement remotely must have the same result as creating it locally after
a long sequence of fragmenting inserts, removals, and replacements.
