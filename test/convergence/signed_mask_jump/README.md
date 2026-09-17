# Signed mask jump

Concurrent removals can leave the Structural Order cursor temporarily inside
negative mask debt. A jump stores only its net Frame distance, so it cannot
prove which intervening positive Strip pays that debt first. While the cursor
index is negative, lookup takes the existing one-Strip walk step; jumps remain
available again after the debt reaches the visible range.

Concurrent Session ordering determines which eligible positive Frames pay the
debt. Ordered, hostile, and restarted delivery must nevertheless expose the
same three Frames at the same projection positions.
