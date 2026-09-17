# Live peer index equivalence through signed jumps

Two live Sequences use different Actor IDs. Every local Gossip reaches the
other peer immediately, and every acknowledgement returned by `apply` travels
back to the author. No sequence is exchanged and neither live instance is
recreated.

The workload alternates whole-Strip inserts, replacements, and removals at the
head, middle, and tail. These edits leave signed Mask Strips between visible
Footage and cause each peer to build a different local gate/jump cache while
integrating the same operations through different public methods.

After every gossip round the guarantee is checked directly on the live peers:

```text
left.projectionFrameCount === right.projectionFrameCount
left.value(position) === right.value(position) for every projection position
```

The final middle replacement must be read identically as:

```text
13 13 14 14 12 12 10 10
```

Sequence equality is intentionally irrelevant to this regression. The target
is the Projection exposed by the two continuously running replicas.
