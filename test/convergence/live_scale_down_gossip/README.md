# Live scale-down gossip

Two live peers execute the benchmark's deterministic eight-step scale-up and
scale-down workload through the public `Sequence` API. Every local delta is
delivered immediately and every returned acknowledgement is sent back to its
author.

The peers must retain the same `visibleFrameCount` and resolve identical
footage from every visible index after every update, including removals during
scale-down after repeated replacements and retained masks.
