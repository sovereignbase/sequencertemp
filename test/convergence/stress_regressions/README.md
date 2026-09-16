# Shrunk stress regressions

These fixtures preserve the smallest replayable examples produced by the
generative convergence stress test. Each example compares exact Projection
values instead of merely checking that execution finishes.

## Historical view at one boundary

Actor 100 creates six insertions. Most target index `0`, but `middle` targets
index `1` after `second` already exists:

```text
root
first  -> root
second -> first -> root
second -> middle -> first -> root
fourth -> second -> middle -> first -> root
fifth  -> fourth -> second -> middle -> first -> root
```

The hostile receiver gets `middle` and `fourth` before `second`. `second` and
`middle` share a stable boundary, so `insertionTime` and `insertionDiff` must
recover the view in which `middle` was authored. Both deliveries must end as:

```text
fifth -> fourth -> second -> middle -> first -> root
```

## Concurrent root subtree after restart

Actor 100 starts with a two-frame root and builds a causal head-insertion
chain. Actor 101 independently inserts `concurrent` into the empty root:

```text
Actor 100: root-0, root-1 -> first -> third -> fourth -> fifth
Actor 101: concurrent
```

The receiver is recreated after the first three packets and those packets are
redelivered. The higher root competitor stays before the complete Actor 100
subtree:

```text
concurrent -> fifth -> fourth -> third -> first -> root-0 -> root-1
```

## Concurrent root outside a replace Mask

Actor 100 creates a four-frame branch, adds `replaced-head`, replaces the first
two local frames, and finally inserts `final-head`. Actor 101 independently
inserts `concurrent` at the root:

```text
Actor 100 local before replace:
replaced-head -> branch-0 -> branch-1 -> branch-2 -> branch-3 -> root

Actor 100 replaces:
replaced-head -> branch-0

Actor 101 concurrently inserts:
concurrent
```

Restart and stale redelivery must not let Actor 100's Mask consume Actor 101's
concurrent root. Ordered delivery, restarted delivery, and snapshot recreation
must all produce:

```text
concurrent -> final-head -> replacement-0 -> replacement-1
  -> branch-1 -> branch-2 -> branch-3 -> root
```

## Tail replacement shares the Mask boundary

The fourth shrink replaces the final `root` frame after a four-frame head
insertion. A concurrent actor has independently inserted at the root:

```text
Actor 100: branch-0 -> branch-1 -> branch-2 -> branch-3 -> root
Actor 101: concurrent

Actor 100: replace root with replacement
Actor 100: insert head-4, then head-5
```

The replacement insertion and its Mask use the same stable boundary. The
positive replacement must precede the negative Mask so the Mask consumes the
old `root`, never the replacement or the concurrent root. Restart and stale
redelivery must produce:

```text
concurrent -> head-5 -> head-4 -> branch-0 -> branch-1
  -> branch-2 -> branch-3 -> replacement
```
