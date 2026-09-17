# Sequence jump preoptimization

A sixteen-insertion Sequence is reconstructed through `Projection` construction.
The constructor must build valid bidirectional jump links during the same
linear Projection pass, using `round(sqrt(projection.length))` as the initial
spacing. Reconstruction must still expose the same footage at every visible
index as the source Projection.
