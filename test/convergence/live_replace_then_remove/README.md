# Live replace then remove

Two continuously synchronized peers repeatedly replace complete logical
strips. Some replacements originate on the primary peer and others on its
peer. Later inserts retain anchors inside footage that has already been
masked.

After those edits, removing one logical strip must have the same result on the
local author and on the peer applying its delta. Both live instances must have
the same `projectionFrameCount` and resolve identical footage at every
projection position.
