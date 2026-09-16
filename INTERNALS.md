# INTERNALS

Explainer of what is going under the hood.

## DATA MODEL

Serializeable data model. Runtime has its own section.

### INSERTION

Describes one insertion into `Structural Order`.

An Insertion always has one of two effects on the `Projection`. A negative `insertionDiff` decreases `visibleFrameCount` while a positive `insertionDiff` increases it.

The absolute value of `insertionDiff` is the `Frame` length of the insertion. While its sing determines its effect on the projection.

Structurally, every insertion grows the `Sequence`. An insertions position is described commutatively so it ca be applied idempotently to Structural Order.

An insertion contains the following information:

- `anchorSession` -- Session identifier of the anchoring insertion i. e. its `insertionSession`.

- `anchorTime` -- Logical time of the session when the anchoring insertion was made.

- `anchorFrame` -- `Frame` offset within the original anchoring insertion from its `insertionTime` towards `insertionEnd` i. e. `insertionTime + |insertionDiff|`
