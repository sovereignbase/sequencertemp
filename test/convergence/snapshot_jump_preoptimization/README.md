# Snapshot jump preoptimization

A sixteen-insertion Snapshot is reconstructed through `Sequence` construction.
The constructor must build valid bidirectional jump links during the same
linear Projection pass, using `round(sqrt(projection.length))` as the initial
spacing. Reconstruction must still expose the same footage at every visible
index as the source Sequence.
