# Concurrent root restart

Actor 100 starts with a two-frame root and builds a causal head-insertion
chain. Actor 101 independently inserts `concurrent` into the empty root:

```text
Actor 100: root-0, root-1 -> first -> third -> fourth -> fifth
Actor 101: concurrent
```

The receiver is recreated after the first three packets and those packets are
redelivered. The per-instance Session IDs may place either root subtree first,
but restart and redelivery must preserve the same index-by-index Projection
without losing, duplicating, or interleaving Frames.
