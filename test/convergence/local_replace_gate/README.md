# Local replace gate

A replacement removes and inserts at the same projection boundary:

```text
a, b, c
replace positions [0, 1] with x, y
x, y, c
insert z at 1
x, z, y, c
```

For a replacement contained by one Strip, the local gate remains on the left
side of the replacement insertion. Its numeric projected position therefore does
not move. A later indexed operation must work without an intervening
`values()` call recalculating the gate.
