# Tail replace Mask

Actor 100 creates a four-frame branch and replaces the final `root`. Actor 101
has independently inserted at the root:

```text
Actor 100: branch-0 -> branch-1 -> branch-2 -> branch-3 -> root
Actor 101: concurrent

Actor 100: replace root with replacement
Actor 100: insert head-4, then head-5
```

The replacement insertion and its Mask use the same stable boundary. The
positive replacement must precede the negative Mask so the Mask consumes the
old `root`, never the replacement or the concurrent root:

```text
concurrent -> head-5 -> head-4 -> branch-0 -> branch-1
  -> branch-2 -> branch-3 -> replacement
```
