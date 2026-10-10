# Projection equivalence before and after hydration

Hydrating an exported Sequence must preserve the visible Frame order.

The local replica removes `old` and inserts `X` at the mask's free endpoint.
A concurrent replica inserts `Y` after `old`, producing `Y, X, tail` when delivered.
That replica has not received the removal, so compaction must retain its mask.
Exporting and hydrating this state must still produce `Y, X, tail`.
