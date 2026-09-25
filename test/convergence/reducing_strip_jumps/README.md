# Reducing strip jumps

Reducing Strips remain fully traversable in Structural Order.

They contribute normally to Structural Order distance, but they never consume Projection length during traversal because that length was already consumed when the affected positive Strip was split.

For jump accounting:

```text
positive Strip  -> contributes its positive Frame diff
reducing Strip  -> contributes 0 Frames
all Strips      -> contribute to StripCount
```

Traversal therefore tracks how far it has moved relative to a known Projection position using the positive Frame contributions encountered along the path. A reducing Strip may change Structural Order, but it does not move the Projection cursor backwards.

For example:

```text
+3 positive Frames
-2 reducing Strip
+4 positive Frames
```

contributes:

```text
FrameCount = 3 + 0 + 4 = 7
StripCount = 3
```

A jump may therefore span reducing Strips normally. The jump's Frame distance describes the visible positive distance between its endpoints, while its Strip distance describes the complete Structural Order span.

When an existing jump crosses a region affected by a new reducing mutation, patching reduces the cached Frame distance by the amount of Projection effect removed from that span:

```text
patchedFrameCount = oldFrameCount + frameDiff
```

Because reducing Footage cannot make a traversal span consume negative Projection length, the result is clamped at zero:

```text
patchedFrameCount = max(0, oldFrameCount + frameDiff)
```

This patching adjustment represents already-visible positive effect being removed from the jump span. It does not mean that the reducing Strip itself contributes a negative traversal length.

The same rule applies throughout traversal:

```text
negative Strip diff does not consume Frame length
positive Strip diff advances Frame distance
```

Ordered, hostile, and restarted delivery may produce different local jump layouts, but every valid jump must obey the same Frame and Strip accounting and all replicas must resolve the same three projected Frames at the same positions.
