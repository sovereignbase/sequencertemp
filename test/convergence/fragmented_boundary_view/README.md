# Fragmented boundary view

Actor 100 authors six insertions against the Projection visible at the time of each edit. Each insertion resolves to a different structural anchor, so this scenario does not require any tie-break between competing insertions.

A text-editing equivalent is:

```text
world
↓ insert "Hello " at index 0
Hello world

↓ insert "Well, " at index 0
Well, Hello world

↓ insert "actually " at index 1
Well, actually Hello world

↓ insert "Now, " at index 0
Now, Well, actually Hello world

↓ insert "Okay, " at index 0
Okay, Now, Well, actually Hello world
```

The test values correspond to those edits as follows:

```text
root

first, root

second, first, root

second, middle, first, root

fourth, second, middle, first, root

fifth, fourth, second, middle, first, root
```

Each operation records the boundary visible when it was authored:

```text
root   -> virtual root anchor
first  -> (root, 0)    // before root
second -> (first, 0)   // before first
middle -> (second, 1)  // after second
fourth -> (second, 0)  // before second
fifth  -> (fourth, 0)  // before fourth
```

The important edit is `middle`. It is authored while the visible Projection is:

```text
Well, | Hello world
       ↑
 insert "actually "
```

so its stable anchor is after `second`, not merely “at visible index 1.” Later edits may fragment the surrounding structure, but they must not change the boundary against which `middle` was originally authored.

The hostile receiver deliberately receives the same operations in a different order:

```text
root
first
middle
fourth
second
fifth
```

In the text example, that is equivalent to receiving the operations for `actually ` and `Now, ` before receiving the `Well, ` insertion they reference.

The receiver must therefore reconstruct placement from the stable anchors encoded by the operations rather than reinterpret their original visible indices against its current Projection. Once all operations are present, both delivery orders must produce exactly:

```text
Okay, Now, Well, actually Hello world
```

or, using the test values:

```text
fifth, fourth, second, middle, first, root
```

This verifies historical boundary resolution: an insertion remains attached to the boundary visible in its author's view even when another replica encounters the same operations through a differently fragmented and differently ordered history.
