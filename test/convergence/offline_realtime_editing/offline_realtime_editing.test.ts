import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.js'
import type { Gossip, Snapshot } from '../../../src/types/type.js'
import {
  deliver,
  expect_converged,
  shuffle_mutations,
} from '../../.helpers/replica.js'
import type { Replica } from '../../.helpers/replica.js'

type SixEditorMutations = {
  base: Snapshot<string>
  base_state: Replica<string>
  online: Array<Gossip<string>>
  offline: [Array<Gossip<string>>, Array<Gossip<string>>, Array<Gossip<string>>]
}

const accepted = <T>(result: Gossip<T>): Gossip<T> => result

const expected_projection = [
  'document',
  'online-1',
  'online-2',
  'online-3',
  'offline-1-1',
  'offline-1-2',
  'offline-2-1',
  'offline-2-2',
  'offline-3-1',
  'offline-3-2',
]

const build_insert_scenario = (): SixEditorMutations => {
  const base_state = new Projection<string>(1)
  accepted(base_state.insert(['document'], 0))
  const base = base_state.snapshot()

  const online_1 = new Projection<string>(90, base)
  const online_root = accepted(
    online_1.insert(['online-1'], online_1.projectionFrameCount)
  )
  const online_2 = new Projection<string>(91, online_1.snapshot())
  const online_middle = accepted(
    online_2.insert(['online-2'], online_2.projectionFrameCount)
  )
  const online_3 = new Projection<string>(92, online_2.snapshot())
  const online_tail = accepted(
    online_3.insert(['online-3'], online_3.projectionFrameCount)
  )

  const offline = ([80, 70, 60] as const).map((actor, branch_index) => {
    const editor = new Projection<string>(actor, base)
    const branch = branch_index + 1
    const root = accepted(
      editor.insert([`offline-${branch}-1`], editor.projectionFrameCount)
    )
    const tail = accepted(
      editor.insert([`offline-${branch}-2`], editor.projectionFrameCount)
    )
    return [root, tail]
  }) as SixEditorMutations['offline']

  return {
    base,
    base_state,
    online: [online_root, online_middle, online_tail],
    offline,
  }
}

const build_lifecycle_scenario = (): SixEditorMutations => {
  const base_state = new Projection<string>(2)
  accepted(base_state.insert(['document'], 0))
  const base = base_state.snapshot()

  const online_1 = new Projection<string>(90, base)
  const online: Array<Gossip<string>> = [
    accepted(online_1.insert(['online-1'], online_1.projectionFrameCount)),
    accepted(online_1.insert(['online-trash'], online_1.projectionFrameCount)),
  ]
  online.push(accepted(online_1.remove(online_1.projectionFrameCount - 1)))

  const online_2 = new Projection<string>(91, online_1.snapshot())
  online.push(
    accepted(online_2.insert(['online-old'], online_2.projectionFrameCount))
  )
  online.push(
    accepted(online_2.replace(['online-2'], online_2.projectionFrameCount - 1))
  )

  const online_3 = new Projection<string>(92, online_2.snapshot())
  online.push(
    accepted(online_3.insert(['online-3'], online_3.projectionFrameCount))
  )

  const offline_1 = new Projection<string>(80, base)
  const branch_1 = [
    accepted(offline_1.insert(['offline-1-1'], offline_1.projectionFrameCount)),
    accepted(
      offline_1.insert(['offline-trash'], offline_1.projectionFrameCount)
    ),
    accepted(offline_1.remove(offline_1.projectionFrameCount - 1)),
    accepted(offline_1.insert(['offline-1-2'], offline_1.projectionFrameCount)),
  ]

  const offline_2 = new Projection<string>(70, base)
  const branch_2 = [
    accepted(offline_2.insert(['offline-2-1'], offline_2.projectionFrameCount)),
    accepted(offline_2.insert(['offline-old'], offline_2.projectionFrameCount)),
    accepted(
      offline_2.replace(['offline-2-2'], offline_2.projectionFrameCount - 1)
    ),
  ]

  const offline_3 = new Projection<string>(60, base)
  const branch_3 = [
    accepted(offline_3.insert(['offline-3-1'], offline_3.projectionFrameCount)),
    accepted(
      offline_3.insert(['offline-trash'], offline_3.projectionFrameCount)
    ),
    accepted(offline_3.remove(offline_3.projectionFrameCount - 1)),
    accepted(offline_3.insert(['offline-old'], offline_3.projectionFrameCount)),
    accepted(
      offline_3.replace(['offline-3-2'], offline_3.projectionFrameCount - 1)
    ),
  ]

  return {
    base,
    base_state,
    online,
    offline: [branch_1, branch_2, branch_3],
  }
}

const all_mutations = ({
  online,
  offline,
}: SixEditorMutations): Array<Gossip<string>> => [...online, ...offline.flat()]

const offline_during_online = ({
  online,
  offline,
}: SixEditorMutations): Array<Gossip<string>> => {
  const pending_offline = offline.flatMap((branch) => [...branch].reverse())
  const interleaved: Array<Gossip<string>> = []
  let offline_index = 0
  for (let online_index = 0; online_index < online.length; ++online_index) {
    interleaved.push(online[online_index])
    const remaining_online = online.length - online_index
    const take = Math.ceil(
      (pending_offline.length - offline_index) / (remaining_online + 1)
    )
    interleaved.push(
      ...pending_offline.slice(offline_index, offline_index + take)
    )
    offline_index += take
  }
  interleaved.push(...pending_offline.slice(offline_index))
  return interleaved
}

const expect_frames = (state: Replica<string>): void => {
  expect(new Set(state.values())).toEqual(new Set(expected_projection))
}

describe('three online and three offline editors', () => {
  it('converges exactly when offline editors arrive during the online session', () => {
    const scenario = build_insert_scenario()
    const chronological = deliver(scenario.base, all_mutations(scenario))
    const mid_session = deliver(scenario.base, offline_during_online(scenario))
    const tail_first = deliver(
      scenario.base,
      [...all_mutations(scenario)].reverse()
    )

    expect_converged(chronological, mid_session)
    expect_converged(chronological, tail_first)
    expect_frames(chronological)
  })

  it(
    'keeps all six causal branches deterministic in 10,000 arrival orders',
    { timeout: 120_000 },
    () => {
      const scenario = build_insert_scenario()
      const mutations = all_mutations(scenario)
      const expected = deliver(scenario.base, mutations)
      for (let case_index = 0; case_index < 10_000; ++case_index) {
        const target = deliver(
          scenario.base,
          shuffle_mutations(mutations, (0x9e37_79b9 + case_index) >>> 0)
        )
        expect_converged(expected, target)
      }
    }
  )

  it('converges mixed insert/remove/replace lifecycles exactly', () => {
    const scenario = build_lifecycle_scenario()
    const mutations = all_mutations(scenario)
    const chronological = deliver(scenario.base, mutations)
    const mid_session = deliver(scenario.base, offline_during_online(scenario))
    const reverse = deliver(scenario.base, [...mutations].reverse())

    expect_converged(chronological, mid_session)
    expect_converged(chronological, reverse)

    for (let case_index = 0; case_index < 64; ++case_index) {
      const target = deliver(
        scenario.base,
        shuffle_mutations(mutations, (0xc0ff_ee00 + case_index) >>> 0)
      )
      expect_converged(chronological, target)
    }
  })
})
