# Browser delivery

The browser starts from:

```text
Hello
```

Two actors edit the same retained Sequence independently:

```text
Actor 2:
Hello left

Actor 3:
Hello right
```

Two browser-side receivers ingest those concurrent edits in opposite network orders through the public TypeScript/WebAssembly API:

```text
Receiver 4:
left -> right

Receiver 5:
right -> left
```

Actor 3 has the larger competing Clock, so both receivers must project the same deterministic result:

```text
Hello right left
```

This verifies the same delivery-order-independent ordering in the actual browser boundary used by the public API.
