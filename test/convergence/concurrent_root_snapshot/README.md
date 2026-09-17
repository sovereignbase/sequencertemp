# Concurrent root snapshot

Three replicas independently insert at the empty Projection root while one of
them also builds a head-insertion subtree:

```text
Actor 100: primary-5 -> primary-4 -> primary-1 -> primary-root
Actor 101: second-root
Actor 102: third-root
```

The first root's logical zero-reservation remains the Structural Order head.
It therefore retains the head of the concurrent-root competitor chain while
the visible root fragment can move behind other complete subtrees. Recreating
the Projection must preserve the Session-ID-derived ordering and every frame.
