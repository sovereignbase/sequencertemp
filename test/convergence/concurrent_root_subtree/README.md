# Concurrent root subtree

Two replicas independently build head-insertion chains from an empty Sequence:

```text
Actor 100: primary-5 -> primary-3 -> primary-2 -> primary-root
Actor 101: concurrent-4 -> concurrent-root
```

The hostile delivery sends Actor 101's complete subtree before Actor 100's
root. Even though Actor 101's root has already split around its child, its root
competitor is still represented by the `rightFragment`. Session ordering may
place either complete subtree first, but network delivery cannot change that
order or interleave their contents.
