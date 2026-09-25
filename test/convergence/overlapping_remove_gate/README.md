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

When these histories are merged, overlapping removes can produce signed remove debt before visible Footage. The gate may therefore sit on the head zero-reservation while negative structural effect exists to its right.

Nothing can exist to the left of `head`, so that reservation still represents Projection position zero:

```text
head | visible content
     ↑
projectedPosition = 0
```

Every delivery order must converge to the same Projection while preserving that cached zero position.
