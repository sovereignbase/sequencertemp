# Local/apply equivalence at a fragmented boundary

The author and receiver begin empty and exchange every Gossip and returned
acknowledgement. The author inserts `1`, replaces it with `2`, then inserts `3`
at the head. Those edits split the original insertion while retaining its
stable coordinate system.

The regression inserts `7` between `3` and `2`:

```text
[3, 3, 2, 2] -> insert([7, 7], 2) -> [3, 3, 7, 7, 2, 2]
```

The visible lookup returns a position within the selected fragment. The Gossip
must add that fragment's original-Strip offset before publishing `anchorFrame`.
Otherwise the local mutation and the receiver's `apply` resolve different
boundaries, and a previously masked value can reappear at the author.
