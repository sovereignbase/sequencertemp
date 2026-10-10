# Sequence jump preoptimization

A sixteen-insertion Sequence is reconstructed through `Projection` construction.
The constructor must build valid bidirectional jump links during the same
linear Projection pass, using `round(sqrt(projection.structuralStripCount))` as the initial
spacing. Reconstruction must still expose the same footage at every visible
index as the source Projection.

Local and remote edits inside those spans must retain usable jumps with matching
visible and structural distances, while preserving the expected visible values.
