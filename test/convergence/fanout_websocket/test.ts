import { expect, test } from '@playwright/test'
import { WebSocket as RelaySocket, WebSocketServer } from 'ws'

/**
 * Opens a minimal stateless WebSocket relay.
 *
 * The relay does not inspect Sequencer payloads, persist document state, assign
 * ordering, or acknowledge edits. Every received frame is simply forwarded to
 * every other connected browser peer.
 */
const openRelay = async () => {
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0 })

  server.on('connection', (client) =>
    client.on('message', (message, binary) => {
      for (const peer of server.clients)
        if (peer !== client && peer.readyState === RelaySocket.OPEN)
          peer.send(message, { binary })
    })
  )

  await new Promise<void>((resolve) => server.once('listening', resolve))

  const address = server.address()

  if (address === null || typeof address === 'string')
    throw new TypeError('WebSocket relay did not bind a TCP port.')

  return {
    url: `ws://127.0.0.1:${address.port}`,

    close: async () => {
      for (const client of server.clients) client.terminate()

      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      )
    },
  }
}

/**
 * Verifies convergence between three continuously running browser peers using
 * an ordinary stateless WebSocket fanout relay.
 *
 * Each browser owns an independent Sequencer/WASM instance and authors four
 * timed edits without waiting for peer delivery or acknowledgements. The relay
 * merely broadcasts each Gossip packet to the other two peers.
 *
 * The workload distributes operation types across the editors:
 *
 * - editor 0 authors Inserts;
 * - editor 1 authors Replaces;
 * - editor 2 authors Removes.
 *
 * Every peer therefore creates four local operations and receives the eight
 * operations authored by the other peers.
 *
 * The test also forces every browser's `crypto.getRandomValues()` to return the
 * same deterministic Uint32 value. Independent WASM instances must still derive
 * distinct Mask Session identities from their Actor identity rather than
 * accidentally sharing the same first random value.
 *
 * After all fanout traffic has been applied:
 *
 * - all three browsers must expose exactly the same visible Projection;
 * - every peer must have received all eight remote Gossip updates;
 * - no remote update may be rejected;
 * - no local edit may be rejected;
 * - reducing operations must contain two distinct Mask Sessions.
 *
 * This exercises the normal browser/WebSocket path with no central Sequencer
 * state, no server-side ordering, and no persisted relay state.
 */
test('regular WebSocket fanout converges without pending delivery', async ({
  browser,
}) => {
  const relay = await openRelay()
  const context = await browser.newContext()
  const pages = await Promise.all([0, 1, 2].map(() => context.newPage()))

  try {
    /**
     * Force identical browser randomness.
     *
     * Regression: independent WASM instances previously received the same first
     * random value and could therefore create colliding Mask Session identities.
     * Actor identity must keep those reducing Sessions distinct.
     */
    await Promise.all(
      pages.map((page) =>
        page.addInitScript(() => {
          Object.defineProperty(Crypto.prototype, 'getRandomValues', {
            configurable: true,

            value<T extends ArrayBufferView | null>(array: T): T {
              if (array instanceof Uint32Array) array.fill(0x1234_5678)

              return array
            },
          })
        })
      )
    )

    /**
     * Initialize three independent browser peers and connect each directly to
     * the stateless relay.
     */
    await Promise.all(
      pages.map(async (page, editor) => {
        await page.goto('/test/browser/index.html')

        await page.waitForFunction(
          () => typeof (window as any).sequencer?.create === 'function'
        )

        await page.evaluate(
          ({ actor, url }) =>
            new Promise<void>((resolve, reject) => {
              const api = (window as any).sequencer
              const socket = new WebSocket(url)

              const runtime = {
                api,
                state: api.create(actor),
                socket,
                received: 0,
                rejected: 0,
                localRejected: 0,
                maskSessions: [],
              }

              ;(window as any).fanoutRuntime = runtime

              // Every relayed Gossip packet is applied directly to the live
              // local Projection.
              socket.onmessage = (event) => {
                const message = JSON.parse(String(event.data))

                const accepted =
                  api.ingest(runtime.state, message.delta) !== false

                if (!accepted) ++runtime.rejected

                ++runtime.received
              }

              socket.onerror = () => reject(new Error('WebSocket failed.'))
              socket.onopen = () => resolve()
            }),
          { actor: 100 + editor, url: relay.url }
        )
      })
    )

    /**
     * Run four independent timed edits per browser.
     *
     * No edit waits for network delivery or an acknowledgement. Editor index
     * determines the operation family, so the complete fanout workload contains
     * concurrent Inserts, Replaces, and Removes.
     */
    await Promise.all(
      pages.map((page, editor) =>
        page.evaluate(
          (editor) =>
            new Promise<void>((resolve) => {
              const runtime = (window as any).fanoutRuntime
              const { api, state, socket } = runtime

              let remaining = 4

              for (let edit = editor; edit < 12; edit += 3)
                setTimeout(() => {
                  const size = api.length(state)

                  const delta =
                    edit % 3 === 0
                      ? api.insert(state, size, [`insert:${edit}`])
                      : edit % 3 === 1
                        ? api.replace(state, edit % size, [`replace:${edit}`])
                        : api.remove(state, edit % size, (edit % size) + 1)

                  if (delta === false) ++runtime.localRejected
                  else {
                    /**
                     * Record Mask Session identities carried by reducing rows.
                     *
                     * The deterministic random override above must not collapse
                     * Masks authored by different actors into one Session.
                     */
                    for (let row = 0; row < delta[1].length; row += 8)
                      if (delta[1][row] === 2)
                        runtime.maskSessions.push(delta[1][row + 6])

                    // Serialize typed Gossip arrays into normal JSON-compatible
                    // arrays before WebSocket transport.
                    const transfer = [
                      Array.from(delta[0]),
                      Array.from(delta[1]),
                    ]

                    if (delta.length === 3) transfer.push(delta[2])

                    socket.send(
                      JSON.stringify({
                        source: editor,
                        edit,
                        delta: transfer,
                      })
                    )
                  }

                  if (--remaining === 0) resolve()
                }, edit * 25)
            }),
          editor
        )
      )
    )

    /**
     * Each editor authors four local operations and therefore receives the
     * eight operations authored by the other two peers.
     */
    const expectedReceived = [8, 8, 8]

    await Promise.all(
      pages.map((page, editor) =>
        page.waitForFunction(
          (expected) => (window as any).fanoutRuntime.received === expected,
          expectedReceived[editor]
        )
      )
    )

    const results = await Promise.all(
      pages.map((page) =>
        page.evaluate(() => {
          const runtime = (window as any).fanoutRuntime

          return {
            values: runtime.api.values(runtime.state),
            received: runtime.received,
            rejected: runtime.rejected,
            localRejected: runtime.localRejected,
            maskSessions: runtime.maskSessions,
          }
        })
      )
    )

    // Stateless fanout and independent local editing must converge to one
    // identical visible Projection in every browser.
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

    /**
     * Identical browser randomness must not collapse reducing operations from
     * different actors into one Mask Session.
     */
    const maskSessions = new Set(
      results.flatMap(({ maskSessions }) => maskSessions)
    )

    expect(maskSessions.size).toBe(2)
  } finally {
    await context.close()
    await relay.close()
  }
})
