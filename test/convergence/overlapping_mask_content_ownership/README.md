# Overlapping mask content ownership

Three replicas independently edit the same six-frame base. Several removals
and replacements overlap the same original Frames while other insertions grow
their local projections.

The greatest concurrent mask owns every duplicated masked Frame, so one Frame
is never masked twice. Chronological, reverse, and deterministic mixed Gossip
delivery must therefore expose the same `projectionFrameCount` and return the
same Footage from every projection position.
