# Unobserved live-peer lookup

Two different Actors exchange every Gossip and acknowledgement while editing at
the head, middle, and tail. Unlike the live index-equivalence scenario, neither
peer calls `value` between edits. Their local gate and jump caches must therefore
remain correct solely through `insert`, `replace`, `remove`, and `apply`.

After four complete editing rounds both peers report eight projected Frames. The
first projection read then checks every position and must return:

```text
15 15 16 16 14 14 10 10
```

The last Frame is especially important: a stale gate used to walk beyond the
structural tail at `value(7)`. Snapshot reconstruction is not involved; the
guarantee applies directly to the continuously running live replicas.
