import { describe, expect, it } from 'vitest'
import { Projection } from '../../../src/class.ts'
import type { Gossip } from '../../../src/types/type.ts'
import { deliver, expect_converged } from '../../.helpers/replica.ts'

describe('overlapping remove gate', () => {
  /**
   * Verifies that remote overlapping reducing operations preserve the
   * receiver's existing gate index. In this scenario the receiver begins with
   * its gate on the head zero-reservation at Projection position zero.
   *
   * Three replicas begin from the same retained two-Frame Sequence. They then
   * independently author overlapping removals, a replacement, and additional
   * insertions around the same original region.
   *
   * The resulting Structural Order contains positive insertions together with
   * multiple signed remove debts covering overlapping historical Frames.
   *
   * The complete operation set is reconstructed twice:
   *
   * - `ordered` receives the mutations in their authored collection order;
   * - `unordered` receives exactly the same mutations in a deliberately reordered
   *   sequence beginning with later removals.
   *
   * Both receivers must converge to the same Projection. In addition, remote
   * application must not move the unordered receiver's locally cached gate:
   * because its pre-apply position is zero, its post-apply position must still
   * be zero despite signed remove debt around the head.
   */
  it('keeps a head zero-reservation gate stable across signed remove debt', () => {
    // Establish the retained two-Frame origin shared by all replicas.
    const seed = new Projection<string>(1)
    seed.insert(['base-0', 'base-1'], 0)

    const sequence = seed.sequence()

    // Fork three independent authors from the same retained Sequence.
    const replicas = [0, 1, 2].map(
      (index) => new Projection<string>(100 + index, sequence)
    )

    const mutations: Array<Gossip<string>> = [
      // Remove the complete original base from replica 2.
      replicas[2].remove(0, 1),

      // Concurrently insert through the original middle boundary.
      replicas[0].insert(['middle-0', 'middle-1'], 1),

      // Extend replica 2 again from its now-empty visible head.
      replicas[2].insert(['tail-0', 'tail-1', 'tail-2'], 0),

      // Concurrently replace the complete original base on replica 1.
      replicas[1].replace(['replacement-0', 'replacement-1'], 0, 1),

      // Remove that replacement locally, adding another reducing operation over
      // the same historical region.
      replicas[1].remove(0, 1),

      // Remove one Frame from replica 2's newly inserted Footage.
      replicas[2].remove(2, 2),
    ]

    // Baseline reconstruction in collection order.
    const ordered = deliver(sequence, mutations)

    // Reconstruct the same operation set in a unordered order where later
    // reducing operations arrive before the historical edits they depend on.
    const unordered = deliver(sequence, [
      mutations[5],
      mutations[4],
      mutations[2],
      mutations[0],
      mutations[3],
      mutations[1],
    ])

    // Delivery order must not change the visible Projection.
    expect_converged(ordered, unordered)

    // Remote application must preserve the receiver's existing gate index.
    // This receiver began on the head zero-reservation, so that index is zero.
    expect(unordered.projectedPosition).toBe(0)
  })
})
