import { expect, test } from '@playwright/test'

type SequencerApi = {
  create<T>(actor: number, sequence?: unknown): unknown
  insert<T>(state: unknown, at: number, values: Array<T>): unknown
  ingest(state: unknown, gossip: unknown): unknown
  sequence(state: unknown): unknown
  values<T>(state: unknown): Array<T>
}

type SequencerWindow = Window & {
  sequencer: SequencerApi
}

/**
 * Verifies browser-runtime convergence when two concurrent Gossip updates are
 * ingested in opposite orders.
 *
 * A common retained Sequence is first established:
 *
 *   base
 *
 * Two independent replicas are then created from that same retained state.
 * Both insert at the same visible boundary after `base`:
 *
 *   left:  base, left
 *   right: base, right
 *
 * The resulting updates are concurrent because neither replica observes the
 * other's insertion before authoring its own.
 *
 * Two fresh browser-side replicas then ingest exactly the same Gossip set in
 * opposite orders:
 *
 *   forward: left -> right
 *   reverse: right -> left
 *
 * Both must resolve the concurrent boundary to the same deterministic
 * Projection. This exercises the actual browser bundle and ingestion path
 * rather than only the direct TypeScript implementation used by unit tests.
 */
test('converges after opposite Gossip staging orders in a browser', async ({
  page,
}) => {
  // Load the browser harness exposing the Sequencer API on `window`.
  await page.goto('/test/browser/index.html')

  // Wait until the browser bundle has initialized its public test API.
  await page.waitForFunction(
    () =>
      typeof (window as unknown as SequencerWindow).sequencer?.create ===
      'function'
  )

  const projections = await page.evaluate(async () => {
    const api = (window as unknown as SequencerWindow).sequencer

    // Establish the common retained origin.
    const base = api.create<string>(1)
    void api.insert(base, 0, ['base'])
    const retained = api.sequence(base)

    // Fork two independent replicas from the same retained Sequence.
    const left = api.create<string>(2, retained)
    const right = api.create<string>(3, retained)

    // Author concurrent insertions at the same boundary after `base`.
    const left_result = api.insert(left, 1, ['left'])
    const right_result = api.insert(right, 1, ['right'])

    // Surface rejected updates explicitly instead of hiding the failure behind
    // a later convergence assertion.
    if (left_result === false || right_result === false)
      return { forward: [], reverse: ['update rejected'] }

    // Reconstruct the same operation set in opposite ingestion orders.
    const forward = api.create<string>(4, retained)
    const reverse = api.create<string>(5, retained)

    api.ingest(forward, left_result)
    api.ingest(forward, right_result)

    api.ingest(reverse, right_result)
    api.ingest(reverse, left_result)

    return {
      forward: api.values(forward),
      reverse: api.values(reverse),
    }
  })

  // Gossip arrival order must not affect the visible Projection.
  expect(projections.forward).toEqual(projections.reverse)

  // The competing insertions must resolve to the browser runtime's canonical
  // deterministic order.
  expect(projections.forward).toEqual(['base', 'right', 'left'])
})
