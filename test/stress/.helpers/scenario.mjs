/** Executes one generated convergence scenario inside an interruptible Worker. */
import { parentPort, workerData as scenario } from 'node:worker_threads'
import { Sequence } from '../../../dist/class.js'

let finished = false
const finish = (ok, message) => {
  if (finished) return
  finished = true
  parentPort.postMessage({ ok, message })
}
const signature = (state) => JSON.stringify(state.values())

let target_actor = 10_000
let operation_index = -1
const deliver = (base, mutations, restart_index, label) => {
  let state = new Sequence(target_actor++, base)
  for (let index = 0; index < mutations.length; ++index) {
    state.apply(mutations[index])
    if (index + 1 === restart_index) {
      state = new Sequence(target_actor++, state.snapshot())
      for (let replay = 0; replay <= index; ++replay)
        state.apply(mutations[replay])
    }
  }
  return state
}

try {
  const base = new Sequence(1)
  if (scenario.base_frame_count > 0) {
    base.insert(
      Array.from(
        { length: scenario.base_frame_count },
        (_, index) => `base-${index}`
      ),
      0
    )
  }
  const retained = base.snapshot()
  const replicas = Array.from({ length: scenario.replica_count }, (_, index) =>
    new Sequence(100 + index, retained)
  )
  const mutations = []

  for (
    operation_index = 0;
    operation_index < scenario.operations.length;
    ++operation_index
  ) {
    const operation = scenario.operations[operation_index]
    const replica_index = operation.replica_selector % scenario.replica_count
    const replica = replicas[replica_index]
    const projection_length = replica.visibleFrameCount
    let mutation
    if (operation.kind === 'remove') {
      if (projection_length === 0) continue
      const start = operation.index_selector % projection_length
      mutation = replica.remove(
        start,
        Math.min(projection_length, start + operation.frame_count)
      )
    } else {
      const frames = Array.from(
        { length: operation.frame_count },
        (_, frame) => `r${replica_index}-o${operation_index}-f${frame}`
      )
      if (operation.kind === 'replace') {
        if (projection_length === 0) continue
        const start = operation.index_selector % projection_length
        const count = Math.min(operation.frame_count, projection_length - start)
        mutation = replica.replace(frames.slice(0, count), start, start + count)
      } else {
        const index = operation.index_selector % (projection_length + 1)
        mutation = replica.insert(frames, index)
      }
    }
    mutations.push(mutation)
  }

  const ordered = deliver(retained, mutations, undefined, 'ordered')
  const expected = signature(ordered)
  const keyed = mutations
    .map((mutation, index) => [
      mutation,
      scenario.delivery_keys[index % scenario.delivery_keys.length],
      index,
    ])
    .sort((left, right) => left[1] - right[1] || left[2] - right[2])
    .map(([mutation]) => mutation)
  const hostile = deliver(retained, keyed, undefined, 'hostile')
  const restarted = deliver(
    retained,
    keyed,
    Math.ceil(mutations.length / 2),
    'restart'
  )
  const recreated = new Sequence(target_actor++, hostile.snapshot())
  for (const [label, target] of [
    ['hostile', hostile],
    ['restart', restarted],
    ['create', recreated],
  ]) {
    const actual = signature(target)
    if (actual !== expected)
      throw new TypeError(
        `${label} diverged; scenario=${JSON.stringify(scenario)}; expected=${expected}; actual=${actual}`
      )
  }
  finish(true)
} catch (error) {
  finish(
    false,
    `operation ${operation_index}: ${error instanceof Error ? error.stack : String(error)}`
  )
}
