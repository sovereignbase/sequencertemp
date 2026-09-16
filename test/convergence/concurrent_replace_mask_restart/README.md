# Concurrent replace Mask restart

Actor 100 creates a four-frame branch, adds `replaced-head`, replaces its first
two local frames, and finally inserts `final-head`. Actor 101 independently
inserts `concurrent` at the root.

```text
Actor 100 before replace:
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
