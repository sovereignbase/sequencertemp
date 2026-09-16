# Concurrent root restart

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
