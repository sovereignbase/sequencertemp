# Overlapping remove gate

Two replicas independently remove the same retained text while concurrent content is inserted through and around that origin.

For example:

```text
old draft
```

One replica removes the complete origin:

```text
old draft
↓ remove

(empty)
```

Another replaces and then removes the same region:

```text
old draft
↓ replace

new version
↓ remove

(empty)
```

Meanwhile, concurrent edits retain anchors inside and around the original text:

```text
old | draft
    ↓ insert "middle"

old middle draft

↓ additional insertion from the empty head

tail content
```

Before the remote histories are applied, the receiver's `projectedPosition` is
zero. Remote operations must preserve that position while `gate` follows the
Strip containing the current visible Frame at that position.

`head` contains the first visible Frame. Non-visible structural Strips may
precede it.

The position is checked before convergence lookups, because local `value()`
calls may move the gate and update `projectedPosition`. Every delivery order
must then resolve to the same visible Projection.
