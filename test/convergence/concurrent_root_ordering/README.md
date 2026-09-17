# Concurrent root ordering

Four editors start from the same empty Sequence and insert independently:

```text
Actor 11: insert "first"  at root
Actor 12: insert "second" at root
Actor 13: insert "third"  at root
Actor 14: insert "fourth" at root
```

All four operations compete at the same boundary. Their per-instance Session
IDs define one deterministic order independently of actor identity.

The test delivers both:

```text
11 -> 12 -> 13 -> 14
14 -> 13 -> 12 -> 11
```

Both replicas must materialize the same Projection, with no missing or
duplicated values. The test does not prescribe one Session-ID order.
