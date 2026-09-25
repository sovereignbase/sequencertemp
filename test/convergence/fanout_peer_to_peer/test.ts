import { expect, test } from '@playwright/test'

/**
 * Verifies causal staging across three real browser peers.
 *
 * Peer A authors a parent and delivers it only to B. B then authors a child
 * against that parent, but the child reaches C before C has received the parent.
 *
 * C must accept and retain the child without materializing it. When the delayed
 * parent later arrives, the pending child must resolve automatically without
 * child redelivery.
 *
 * Final state:
 *
 *   A: A:parent, B:child
 *   B: A:parent, B:child
 *   C: A:parent, B:child
 *
 * This exercises causal staging through the public browser API rather than the
 * direct Projection implementation.
 */
test('peer gossip resolves B child at C after delayed A parent', async ({
  browser,
}) => {
  const context = await browser.newContext()
  const [a, b, c] = await Promise.all([0, 1, 2].map(() => context.newPage()))

  try {
    // Create three independent browser peers.
    await Promise.all(
      [a, b, c].map(async (page, peer) => {
        await page.goto('/test/browser/index.html')

        await page.waitForFunction(
          () => typeof (window as any).sequencer?.create === 'function'
        )

        await page.evaluate((actor) => {
          const api = (window as any).sequencer
          ;(window as any).causalPeer = { api, state: api.create(actor) }
        }, 300 + peer)
      })
    )

    // A authors the parent and delivers it only to B.
    const parent = await a.evaluate(() => {
      const { api, state } = (window as any).causalPeer
      const delta = api.insert(state, 0, ['A:parent'])

      if (delta === false) throw new Error('A rejected its local parent.')

      return [Array.from(delta[0]), Array.from(delta[1]), delta[2]]
    })

    expect(
      await b.evaluate((delta) => {
        const { api, state } = (window as any).causalPeer
        return api.ingest(state, delta) !== false
      }, parent)
    ).toBe(true)

    // B authors a child after A's parent. C has never seen the parent, so this
    // operation must be accepted into pending rather than partially projected.
    const child = await b.evaluate(() => {
      const { api, state } = (window as any).causalPeer
      const delta = api.insert(state, 1, ['B:child'])

      if (delta === false) throw new Error('B rejected its local child.')

      return [Array.from(delta[0]), Array.from(delta[1]), delta[2]]
    })

    expect(
      await c.evaluate((delta) => {
        const { api, state } = (window as any).causalPeer
        return api.ingest(state, delta) !== false
      }, child)
    ).toBe(true)

    // The unresolved child remains invisible until its missing parent arrives.
    expect(
      await c.evaluate(() => {
        const { api, state } = (window as any).causalPeer
        return api.values(state)
      })
    ).toEqual([])

    // The delayed parent must automatically unlock C's retained child. The
    // child itself is not redelivered.
    expect(
      await c.evaluate((delta) => {
        const { api, state } = (window as any).causalPeer
        return api.ingest(state, delta) !== false
      }, parent)
    ).toBe(true)

    // Complete A's view by delivering B's child back to A.
    expect(
      await a.evaluate((delta) => {
        const { api, state } = (window as any).causalPeer
        return api.ingest(state, delta) !== false
      }, child)
    ).toBe(true)

    const values = await Promise.all(
      [a, b, c].map((page) =>
        page.evaluate(() => {
          const { api, state } = (window as any).causalPeer
          return api.values(state)
        })
      )
    )

    // All three browser peers must expose the exact same causal Projection.
    expect(values).toEqual([
      ['A:parent', 'B:child'],
      ['A:parent', 'B:child'],
      ['A:parent', 'B:child'],
    ])
  } finally {
    await context.close()
  }
})

/**
 * Verifies convergence between three continuously running browser peers while
 * each editor authors operations on independent timers and receives concurrent
 * Gossip in a different network order.
 *
 * The peers communicate through BroadcastChannel. Every receiver applies a
 * deterministic sender/editor-specific delay, so cross-sender operations are
 * intentionally observed in different orders.
 *
 * The workload has two phases:
 *
 * 1. All three editors independently create concurrent root insertions.
 * 2. Each editor continues with three timed insert/replace/remove operations
 *    against its own live Projection.
 *
 * No local edit waits for a remote packet. The edit intervals are merely longer
 * than the bounded network jitter, allowing ordinary causal continuation while
 * concurrent cross-peer operations still arrive in different orders.
 *
 * After all eight remote updates have reached every peer:
 *
 * - all three visible Projections must be identical;
 * - every remote update must have been accepted;
 * - every local mutation must have been accepted.
 *
 * This exercises live peer convergence through the browser TypeScript/WASM API,
 * real browser event loops, timers, BroadcastChannel delivery, and independent
 * network reordering.
 */
test('peer browsers converge with independent reordering and editor timers', async ({
  browser,
}) => {
  const context = await browser.newContext()
  const pages = await Promise.all([0, 1, 2].map(() => context.newPage()))
  const channelName = `sequencer-p2p-${Date.now()}`

  try {
    // Initialize three independent live peers sharing one BroadcastChannel.
    await Promise.all(
      pages.map(async (page, editor) => {
        await page.goto('/test/browser/index.html')

        await page.waitForFunction(
          () => typeof (window as any).sequencer?.create === 'function'
        )

        await page.evaluate(
          ({ actor, channelName, editor }) => {
            const api = (window as any).sequencer
            const channel = new BroadcastChannel(channelName)

            const runtime = {
              actor,
              api,
              state: api.create(actor),
              channel,
              received: 0,
              rejected: 0,
              localRejected: 0,
            }

            ;(window as any).peerRuntime = runtime

            channel.onmessage = (event) => {
              const { source, ordinal, delta } = event.data

              // Give each receiver a different deterministic delivery delay.
              // Concurrent operations therefore arrive in different orders at
              // different peers.
              const delay = (editor * 11 + source * 7 + ordinal * 3) % 19

              setTimeout(() => {
                if (api.ingest(runtime.state, delta) === false)
                  ++runtime.rejected

                ++runtime.received
              }, delay)
            }
          },
          { actor: 200 + editor, channelName, editor }
        )
      })
    )

    /**
     * Author three independent concurrent roots.
     *
     * None depends on another peer's root, so all three may be received and
     * integrated in different orders without causal staging.
     */
    await Promise.all(
      pages.map((page, editor) =>
        page.evaluate(
          (editor) =>
            new Promise<void>((resolve) =>
              setTimeout(() => {
                const runtime = (window as any).peerRuntime

                const delta = runtime.api.insert(runtime.state, 0, [
                  `root:${editor}`,
                ])

                if (delta === false) ++runtime.localRejected
                else
                  runtime.channel.postMessage({
                    source: editor,
                    ordinal: 0,
                    delta,
                  })

                resolve()
              }, editor * 3)
            ),
          editor
        )
      )
    )

    // Each peer must receive the other two root operations.
    await Promise.all(
      pages.map((page) =>
        page.waitForFunction(() => (window as any).peerRuntime.received === 2)
      )
    )

    /**
     * Continue normal editing independently on each peer.
     *
     * Every editor authors three operations on its own timers. No callback waits
     * for a peer message before creating the next local edit.
     */
    await Promise.all(
      pages.map((page, editor) =>
        page.evaluate(
          (editor) =>
            new Promise<void>((resolve) => {
              const runtime = (window as any).peerRuntime
              let remaining = 3

              for (let edit = editor; edit < 9; edit += 3)
                setTimeout(
                  () => {
                    const { api, state, channel } = runtime
                    const size = api.length(state)

                    const delta =
                      edit % 3 === 0
                        ? api.insert(state, size, [`insert:${edit}`])
                        : edit % 3 === 1
                          ? api.replace(state, edit % size, [`replace:${edit}`])
                          : api.remove(state, edit % size, (edit % size) + 1)

                    if (delta === false) ++runtime.localRejected
                    else
                      channel.postMessage({
                        source: editor,
                        ordinal: edit + 1,
                        delta,
                      })

                    if (--remaining === 0) resolve()
                  },
                  50 + edit * 40
                )
            }),
          editor
        )
      )
    )

    // Each peer authored three updates and must receive the other six, in
    // addition to the two root updates already received.
    await Promise.all(
      pages.map((page) =>
        page.waitForFunction(() => (window as any).peerRuntime.received === 8)
      )
    )

    const results = await Promise.all(
      pages.map((page) =>
        page.evaluate(() => {
          const runtime = (window as any).peerRuntime

          runtime.channel.close()

          return {
            values: runtime.api.values(runtime.state),
            received: runtime.received,
            rejected: runtime.rejected,
            localRejected: runtime.localRejected,
          }
        })
      )
    )

    // Independent network ordering must still produce one identical Projection.
    expect(results.map(({ values }) => values)).toEqual([
      results[0].values,
      results[0].values,
      results[0].values,
    ])

    // Every expected local and remote operation must have been accepted.
    for (const result of results) {
      expect(result.received).toBe(8)
      expect(result.rejected).toBe(0)
      expect(result.localRejected).toBe(0)
    }
  } finally {
    await context.close()
  }
})
