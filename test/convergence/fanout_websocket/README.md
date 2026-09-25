# Regular WebSocket fanout

Three browser replicas connect to one deliberately ignorant WebSocket relay. The relay stores no document state, parses no Gossip, and simply broadcasts each text frame to the other connected peers.

Each editor runs independently on its own timers.

For example, they may begin from:

```text
Hello world.
```

Editor 0 performs inserts:

```text
Hello world.

↓ insert "beautiful "

Hello beautiful world.

↓ insert "today "

Hello beautiful world today.
```

Editor 1 independently performs replacements:

```text
Hello world.

↓ replace "world" with "everyone"

Hello everyone.

↓ replace "Hello" with "Welcome"

Welcome everyone.
```

Editor 2 independently performs removals:

```text
Hello world.

↓ remove "Hello "

world.

↓ remove "world."

(empty)
```

No editor waits for delivery, an acknowledgement, or another editor before executing its next operation:

```text
editor 0: insert  at 0,   75, 150, and 225 ms
editor 1: replace at 25, 100, 175, and 250 ms
editor 2: remove   at 50, 125, 200, and 275 ms
```

After all Gossip has been fanned out, the concurrent insertions that survive their causal histories must remain present, removed or replaced Footage must remain absent, and every browser must materialize the same deterministic Projection.

For example:

```text
Welcome beautiful everyone today.
```

Expected per browser:

```text
4 local Gossip updates sent
8 peer Gossip updates received
0 rejected local edits
0 rejected peer Gossip updates
identical final visible Projection
```

This is the normal timer-driven FIFO case. A sender's own causal chain is not intentionally reordered, so no pending state should be required.

Transport is part of the tested path: the relay uses the maintained `ws` implementation and performs only raw WebSocket fanout.
