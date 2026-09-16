# Concurrent root snapshot

Three replicas independently insert at the empty Sequence root while one of
them also builds a head-insertion subtree:

```text
Actor 100: primary-5 -> primary-4 -> primary-1 -> primary-root
Actor 101: second-root
Actor 102: third-root
```

The first root's logical zero-reservation remains the Structural Order head.
It therefore retains the head of the concurrent-root competitor chain while
the visible root fragment can move behind other complete subtrees:

```text
third-root -> second-root
  -> primary-5 -> primary-4 -> primary-1 -> primary-root
```

Recreating the Sequence from its snapshot must preserve that ordering.
