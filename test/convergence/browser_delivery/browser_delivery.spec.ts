import { expect, test } from '@playwright/test'

type SequencerApi = {
  create<T>(actor: number, snapshot?: unknown): unknown
  insert<T>(state: unknown, at: number, values: Array<T>): unknown
  ingest(state: unknown, gossip: unknown): unknown
  snapshot(state: unknown): unknown
  values<T>(state: unknown): Array<T>
}

type SequencerWindow = Window & {
  sequencer: SequencerApi
}

test('converges after opposite Gossip staging orders in a browser', async ({
  page,
}) => {
  await page.goto('/test/browser/index.html')
  await page.waitForFunction(
    () =>
      typeof (window as unknown as SequencerWindow).sequencer?.create ===
      'function'
  )

  const projections = await page.evaluate(async () => {
    const api = (window as unknown as SequencerWindow).sequencer
    const base = api.create<string>(1)
    void api.insert(base, 0, ['base'])
    const retained = api.snapshot(base)
    const left = api.create<string>(2, retained)
    const right = api.create<string>(3, retained)
    const left_result = api.insert(left, 1, ['left'])
    const right_result = api.insert(right, 1, ['right'])

    if (left_result === false || right_result === false)
      return { forward: [], reverse: ['update rejected'] }

    const forward = api.create<string>(4, retained)
    const reverse = api.create<string>(5, retained)
    api.ingest(forward, left_result)
    api.ingest(forward, right_result)
    api.ingest(reverse, right_result)
    api.ingest(reverse, left_result)

    return { forward: api.values(forward), reverse: api.values(reverse) }
  })

  expect(projections.forward).toEqual(projections.reverse)
  expect(projections.forward).toEqual(['base', 'right', 'left'])
})
