# Pending replace pair

An author inserts one parent Frame and immediately replaces it. A receiver
gets the two-entry replace Gossip before the parent Gossip, so both its Mask and
replacement insertion must wait in the pending table.

When the parent arrives, pending delivery must retain the original atomic
order:

```text
Mask -> replacement insertion
```

The pending receiver and an ordered receiver must expose one visible Frame at
index zero containing `replacement`. This guarantees that stack-based pending
processing cannot reverse the two entries and lose their replace relationship.
