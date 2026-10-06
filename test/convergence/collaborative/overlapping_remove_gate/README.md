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

Before the remote histories are applied, the receiver's local gate is cached on
the head zero-reservation at Projection position zero. Applying remote
operations must preserve that existing gate index; remote structural changes
must not silently relocate the receiver's local traversal cursor.

Nothing can exist to the left of `head`, so that reservation still represents Projection position zero:

```text
head | visible content
     ↑
projectedPosition = 0
```

Every delivery order must converge to the same Projection while preserving the
receiver's pre-apply cached gate position, which is zero in this scenario.
