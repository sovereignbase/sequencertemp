import { Projection } from '../dist/class.js'

let deliveryActor = 10_000

const stage = (title, replicas, note = '') => ({ title, replicas, note })
const replica = (label, projection, note = '') => ({ label, projection, note })

const valuesByLookup = (projection) =>
  Array.from({ length: projection.projectionFrameCount }, (_, index) =>
    projection.value(index)
  )

const firstDifference = (left, right) => {
  if (left.projectionFrameCount !== right.projectionFrameCount)
    return `length ${left.projectionFrameCount} !== ${right.projectionFrameCount}`

  const leftValues = valuesByLookup(left)
  const rightValues = valuesByLookup(right)
  const index = rightValues.findIndex((value, at) => value !== leftValues[at])

  return index === -1
    ? undefined
    : `position ${index}: ${JSON.stringify(leftValues[index])} !== ${JSON.stringify(rightValues[index])}`
}

const assertEquivalent = (left, right) => {
  const difference = firstDifference(left, right)
  if (difference) throw new Error(difference)
}

const gossip = (author, receiver, update) => {
  const acknowledgements = receiver.apply(update)?.[1]
  if (acknowledgements) author.apply(acknowledgements)
}

const deliver = (base, mutations, restartAt) => {
  let projection = new Projection(deliveryActor++, base)

  for (let index = 0; index < mutations.length; ++index) {
    projection.apply(mutations[index])

    if (index + 1 === restartAt) {
      projection = new Projection(deliveryActor++, projection.sequence())
      for (let replay = 0; replay <= index; ++replay)
        projection.apply(mutations[replay])
    }
  }

  return projection
}

const shuffled = (mutations, seed) => {
  const result = [...mutations]
  for (let index = result.length - 1; index > 0; --index) {
    seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0
    const other = seed % (index + 1)
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

class Random {
  constructor(seed) {
    this.state = seed >>> 0 || 0x6d2b79f5
  }

  nextUint32() {
    let value = (this.state += 0x6d2b79f5)
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return (value ^ (value >>> 14)) >>> 0
  }

  integer(maximum) {
    return Math.floor((this.nextUint32() / 0x1_0000_0000) * maximum)
  }

  inclusive(minimum, maximum) {
    return minimum + this.integer(maximum - minimum + 1)
  }
}

const seedFromString = (value) => {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; ++index) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

const deriveSeed = (seed, label) =>
  seedFromString(`${seed.toString(16)}:${label}`)

class StripIndex {
  entries = []

  get count() {
    return this.entries.length
  }

  get frameCount() {
    return this.entries.reduce((total, entry) => total + entry.length, 0)
  }

  frameOffsetAt(index) {
    return this.entries
      .slice(0, index)
      .reduce((total, entry) => total + entry.length, 0)
  }

  at(index) {
    return { ...this.entries[index] }
  }

  insert(index, entry) {
    this.entries.splice(index, 0, { ...entry })
  }

  remove(index) {
    return this.entries.splice(index, 1)[0]
  }

  replace(index, entry) {
    this.entries[index] = { ...entry }
  }
}

const run = (title, body) => {
  try {
    const result = body()
    return { title, ...result }
  } catch (error) {
    return {
      title,
      error,
      note: 'Skenaario heitti ennen kuin se ehti palauttaa inspectoitavat replicat.',
      stages: [],
    }
  }
}

const authorWorkload = (retained, actorCount, operations, sessions) => {
  const authors = Array.from(
    { length: actorCount },
    (_, index) => new Projection(100 + index, retained)
  )

  if (sessions)
    authors.forEach((author, index) => {
      author.increaseClock[0] = sessions[index][0]
      author.decreaseClock[0] = sessions[index][1]
    })

  const mutations = []

  operations.forEach(
    ([kind, authorSelector, indexSelector, frameCount], operationIndex) => {
      const authorIndex = authorSelector % authors.length
      const author = authors[authorIndex]
      const length = author.projectionFrameCount

      if (kind === 'remove') {
        if (length !== 0) {
          const start = indexSelector % length
          mutations.push(
            author.remove(start, Math.min(length - 1, start + frameCount - 1))
          )
        }
        return
      }

      const footage = Array.from(
        { length: frameCount },
        (_, frame) => `r${authorIndex}-o${operationIndex}-f${frame}`
      )

      if (kind === 'replace') {
        if (length !== 0) {
          const start = indexSelector % length
          const count = Math.min(frameCount, length - start)
          mutations.push(
            author.replace(footage.slice(0, count), start, start + count - 1)
          )
        }
        return
      }

      mutations.push(author.insert(footage, indexSelector % (length + 1)))
    }
  )

  return mutations
}

const concurrentReplacement = () =>
  run('concurrent replacement delivery', () => {
    const operations = [
      ['insert', 180133792, 1109629188, 4],
      ['replace', 1199022686, 394473361, 1],
      ['insert', 581967531, 387536348, 1],
      ['replace', 1483458282, 12320982, 1],
      ['replace', 1099093393, 443596640, 1],
      ['replace', 1025719290, 120165420, 4],
      ['remove', 1165076140, 389590309, 1],
      ['replace', 381757984, 1887995565, 1],
    ]
    const keys = [
      -1217396083, -7, -19, 20, -2147483641, -779887926, 2147483629, -28,
      -2147483620, -26,
    ]
    const seed = new Projection(1)
    seed.insert(
      Array.from({ length: 5 }, (_, index) => `base-${index}`),
      0
    )
    const retained = seed.sequence()
    const mutations = authorWorkload(retained, 3, operations)
    const chronological = deliver(retained, mutations)
    const mixed = deliver(
      retained,
      mutations
        .map((update, index) => ({
          update,
          key: keys[index % keys.length],
          index,
        }))
        .sort((left, right) => left.key - right.key || left.index - right.index)
        .map(({ update }) => update)
    )

    return {
      note: 'Sama mutation-setti authorointijärjestyksessä ja deterministisesti sekoitettuna.',
      stages: [
        stage('delivery order', [
          replica('this / chronological', chronological),
          replica('peer / mixed', mixed),
        ]),
      ],
    }
  })

const unorderedReplace = () =>
  run('unordered replace delivery', () => {
    const operations = [
      ['replace', 1837749800, 20512115, 1],
      ['replace', 1617521697, 1569299415, 1],
      ['insert', 1268534401, 1502952196, 4],
      ['insert', 743700871, 256912417, 1],
      ['insert', 1606676183, 1277281821, 1],
      ['replace', 171658493, 147095872, 3],
      ['remove', 664514791, 350362757, 1],
      ['replace', 522327745, 848656602, 3],
      ['remove', 692013875, 731636726, 2],
      ['remove', 1350957019, 300076836, 1],
      ['insert', 2083558510, 429549960, 4],
      ['replace', 163720766, 565574588, 4],
      ['insert', 735715695, 1304623410, 3],
      ['replace', 9806760, 2084350484, 1],
      ['replace', 556989605, 671512747, 3],
      ['replace', 1955270739, 1148533248, 1],
    ]
    const keys = [-587545375, -1451642704, 450361033, -1237044316, 746367878]
    const seed = new Projection(1)
    seed.insert(['base-0', 'base-1', 'base-2', 'base-3'], 0)
    const retained = seed.sequence()
    const mutations = authorWorkload(retained, 2, operations)
    const chronological = deliver(retained, mutations)
    const reverse = deliver(retained, [...mutations].reverse())
    const mixed = deliver(
      retained,
      mutations
        .map((update, index) => ({
          update,
          key: keys[index % keys.length],
          index,
        }))
        .sort((left, right) => left.key - right.key || left.index - right.index)
        .map(({ update }) => update)
    )

    return {
      note: 'Chronological on baseline; reverse ja mixed sen alla.',
      stages: [
        stage('three delivery orders', [
          replica('this / chronological', chronological),
          replica('peer / reverse', reverse),
          replica('peer / mixed', mixed),
        ]),
      ],
    }
  })

const overlappingOwnership = () =>
  run('overlapping remove ownership', () => {
    const operations = [
      ['remove', 2046280841, 395543388, 3],
      ['insert', 1269260299, 509571653, 2],
      ['insert', 682928331, 1883896801, 2],
      ['insert', 308408876, 307794834, 2],
      ['remove', 1313517349, 1028241202, 1],
      ['replace', 425806567, 1316093502, 2],
      ['remove', 1784413307, 1183766439, 2],
      ['insert', 899878280, 481760832, 3],
      ['replace', 1934409216, 150408220, 2],
      ['insert', 27945260, 108302903, 2],
      ['remove', 503092380, 298607732, 4],
      ['remove', 1631815643, 2072606514, 1],
      ['insert', 452223204, 249485537, 1],
      ['insert', 199131081, 1219490238, 1],
    ]
    const keys = [
      424738099, 173723364, 1960494304, 614813501, 700557849, -1769193726,
      -1179057743, 208131268, 805600223, 1204235890,
    ]
    const sessions = [
      [1310894871851451, 8540722160613772],
      [3273387611390330, 4888754746934803],
      [8750552661131626, 8381653247400557],
    ]
    const seed = new Projection(1)
    seed.insert(
      Array.from({ length: 6 }, (_, index) => `base-${index}`),
      0
    )
    const retained = seed.sequence()
    const mutations = authorWorkload(retained, 3, operations, sessions)
    const chronological = deliver(retained, mutations)
    const reverse = deliver(retained, [...mutations].reverse())
    const mixed = deliver(
      retained,
      mutations
        .map((update, index) => ({
          update,
          key: keys[index % keys.length],
          index,
        }))
        .sort((left, right) => left.key - right.key || left.index - right.index)
        .map(({ update }) => update)
    )

    return {
      stages: [
        stage('ownership by delivery order', [
          replica('this / chronological', chronological),
          replica('peer / reverse', reverse),
          replica('peer / mixed', mixed),
        ]),
      ],
    }
  })

const overlappingGate = () =>
  run('overlapping remove gate', () => {
    const seed = new Projection(1)
    seed.insert(['base-0', 'base-1'], 0)
    const retained = seed.sequence()
    const authors = [0, 1, 2].map(
      (index) => new Projection(100 + index, retained)
    )
    const mutations = [
      authors[2].remove(0, 1),
      authors[0].insert(['middle-0', 'middle-1'], 1),
      authors[2].insert(['tail-0', 'tail-1', 'tail-2'], 0),
      authors[1].replace(['replacement-0', 'replacement-1'], 0, 1),
      authors[1].remove(0, 1),
      authors[2].remove(2, 2),
    ]
    const ordered = deliver(retained, mutations)
    const unordered = deliver(retained, [
      mutations[5],
      mutations[4],
      mutations[2],
      mutations[0],
      mutations[3],
      mutations[1],
    ])

    return {
      note: `Testi odottaa unordered.projectedPosition === 0; toteutunut ${unordered.projectedPosition}.`,
      stages: [
        stage('gate after overlapping masks', [
          replica('this / ordered', ordered),
          replica('peer / unordered', unordered),
        ]),
      ],
    }
  })

const sameActor = () =>
  run('same actor multi replica', () => {
    const seed = new Projection(1)
    seed.insert(['a', 'b', 'c', 'd'], 0)
    const retained = seed.sequence()
    const left = new Projection(42, retained)
    const right = new Projection(42, retained)
    const leftInsert = left.insert(['left-0', 'left-1'], 1)
    const leftReplace = left.replace(['left-r0', 'left-r1'], 2, 3)
    const rightInsert = right.insert(['right-0', 'right-1'], 3)
    const rightRemove = right.remove(1, 2)

    gossip(left, right, leftInsert)
    gossip(left, right, leftReplace)
    gossip(right, left, rightRemove)
    gossip(right, left, rightInsert)

    const leftTail = left.insert(['left-tail'], left.projectionFrameCount)
    const rightHead = right.replace(['right-head'], 0, 0)
    gossip(right, left, rightHead)
    gossip(left, right, leftTail)

    const replay = new Projection(42, retained)
    for (const update of [
      rightHead,
      leftTail,
      rightRemove,
      rightInsert,
      leftReplace,
      leftInsert,
    ])
      replay.apply(update)

    return {
      note: 'Kaikki kolme käyttävät actorID 42:ta mutta instanssikohtaisia sessioita.',
      stages: [
        stage('live tabs and replay', [
          replica('this / left', left),
          replica('peer / right', right),
          replica('peer / reordered replay', replay),
        ]),
      ],
    }
  })

const tailReplaceRemove = () =>
  run('tail replace remove', () => {
    const primary = new Projection(100)
    const concurrent = new Projection(101)
    const mutations = [
      primary.insert(['root'], 0),
      primary.insert(['branch-0', 'branch-1', 'branch-2', 'branch-3'], 0),
      concurrent.insert(['concurrent'], 0),
      primary.replace(['replacement'], 4, 4),
      primary.insert(['head-4'], 0),
      primary.insert(['head-5'], 0),
    ]
    const empty = [[], []]
    const ordered = deliver(empty, mutations)
    const restarted = deliver(empty, mutations, 3)

    return {
      note: 'Renderer näyttää values()-exceptionin kortissa eikä pysäytä muita skenaarioita.',
      stages: [
        stage('continuous versus restart', [
          replica('this / ordered', ordered),
          replica('peer / restarted before replace', restarted),
        ]),
      ],
    }
  })

const liveUnobserved = () =>
  run('live unobserved peer lookup', () => {
    const state = new Projection(1)
    const peer = new Projection(2)
    let operation = 'initial'
    let error

    const send = (label, author, receiver, update) => {
      operation = label
      gossip(author, receiver, update)
    }

    try {
      send('insert 1', state, peer, state.insert([1, 1], 0))
      send('replace 2', state, peer, state.replace([2, 2], 0, 1))
      send('remove 2', state, peer, state.remove(0, 1))
      send('insert 3', state, peer, state.insert([3, 3], 0))
      send('peer replace 4', peer, state, peer.replace([4, 4], 0, 1))
      send('insert 5', state, peer, state.insert([5, 5], 0))
      send('replace 6', state, peer, state.replace([6, 6], 0, 1))
      send('remove head', state, peer, state.remove(0, 1))
      send('insert 7', state, peer, state.insert([7, 7], 2))
      send('peer replace 8', peer, state, peer.replace([8, 8], 0, 1))
      send('insert 9', state, peer, state.insert([9, 9], 4))
      send('replace 10', state, peer, state.replace([10, 10], 2, 3))
      send('remove 4..5', state, peer, state.remove(4, 5))
      send('insert 11', state, peer, state.insert([11, 11], 2))
      send('peer replace 12', peer, state, peer.replace([12, 12], 2, 3))
      send('insert 13', state, peer, state.insert([13, 13], 0))
      send('replace 14', state, peer, state.replace([14, 14], 2, 3))
      send('remove 4..5 again', state, peer, state.remove(4, 5))
      send('insert 15', state, peer, state.insert([15, 15], 0))
      send('peer replace 16', peer, state, peer.replace([16, 16], 2, 3))
    } catch (caught) {
      error = caught
    }

    return {
      error,
      note: `Viimeinen aloitettu operaatio: ${operation}. Odotus: [15,15,16,16,14,14,10,10].`,
      stages: [
        stage('live synchronized peers', [
          replica('this / state', state),
          replica('peer', peer),
        ]),
      ],
    }
  })

const liveReplaceThenRemove = () =>
  run('live replace then remove', () => {
    const primary = new Projection(3)
    const peer = new Projection(4)
    primary.decreaseClock[0] = 531265640
    peer.decreaseClock[0] = 420094554
    const frames = (value, length) => new Array(length).fill(value)
    let operation = 'initial'
    let error

    const send = (label, author, receiver, update) => {
      operation = label
      gossip(author, receiver, update)
      assertEquivalent(author, receiver)
    }

    const steps = [
      () =>
        send('insert 1x86', primary, peer, primary.insert(frames(1, 86), 0)),
      () =>
        send(
          'replace 2x86',
          primary,
          peer,
          primary.replace(frames(2, 86), 0, 85)
        ),
      () => send('remove 0..85', primary, peer, primary.remove(0, 85)),
      () =>
        send('insert 3x90', primary, peer, primary.insert(frames(3, 90), 0)),
      () =>
        send(
          'peer replace 4x90',
          peer,
          primary,
          peer.replace(frames(4, 90), 0, 89)
        ),
      () =>
        send('insert 5x77', primary, peer, primary.insert(frames(5, 77), 0)),
      () =>
        send(
          'replace 6x90',
          primary,
          peer,
          primary.replace(frames(6, 90), 77, 166)
        ),
      () => send('remove 0..76', primary, peer, primary.remove(0, 76)),
      () =>
        send('insert 7x28', primary, peer, primary.insert(frames(7, 28), 0)),
      () =>
        send(
          'peer replace 8x90',
          peer,
          primary,
          peer.replace(frames(8, 90), 28, 117)
        ),
      () =>
        send('insert 9x3', primary, peer, primary.insert(frames(9, 3), 118)),
      () =>
        send(
          'replace 10x28',
          primary,
          peer,
          primary.replace(frames(10, 28), 0, 27)
        ),
      () => send('remove 28..117', primary, peer, primary.remove(28, 117)),
      () =>
        send('insert 11x88', primary, peer, primary.insert(frames(11, 88), 31)),
      () =>
        send(
          'peer replace 12x28',
          peer,
          primary,
          peer.replace(frames(12, 28), 0, 27)
        ),
      () =>
        send('insert 13x42', primary, peer, primary.insert(frames(13, 42), 0)),
      () =>
        send(
          'replace 14x3',
          primary,
          peer,
          primary.replace(frames(14, 3), 70, 72)
        ),
      () => send('remove 73..160', primary, peer, primary.remove(73, 160)),
      () =>
        send('insert 15x96', primary, peer, primary.insert(frames(15, 96), 0)),
      () =>
        send(
          'peer replace 16x96',
          peer,
          primary,
          peer.replace(frames(16, 96), 0, 95)
        ),
      () =>
        send(
          'insert 17x66',
          primary,
          peer,
          primary.insert(frames(17, 66), 169)
        ),
      () =>
        send(
          'replace 18x96',
          primary,
          peer,
          primary.replace(frames(18, 96), 0, 95)
        ),
      () => send('remove 138..165', primary, peer, primary.remove(138, 165)),
    ]

    try {
      for (const step of steps) step()
    } catch (caught) {
      error = caught
    }

    return {
      error,
      note: `Ensimmäinen epäonnistuva operaatio: ${operation}.`,
      stages: [
        stage('local mutation versus remote apply', [
          replica('this / author', primary),
          replica('peer / receiver', peer),
        ]),
      ],
    }
  })

const lifecycleScenario = () => {
  const baseState = new Projection(2)
  baseState.insert(['document'], 0)
  const base = baseState.sequence()
  const online1 = new Projection(90, base)
  const online = [
    online1.insert(['online-1'], online1.projectionFrameCount),
    online1.insert(['online-trash'], online1.projectionFrameCount),
  ]
  online.push(online1.remove(online1.projectionFrameCount - 1))
  const online2 = new Projection(91, online1.sequence())
  online.push(online2.insert(['online-old'], online2.projectionFrameCount))
  online.push(online2.replace(['online-2'], online2.projectionFrameCount - 1))
  const online3 = new Projection(92, online2.sequence())
  online.push(online3.insert(['online-3'], online3.projectionFrameCount))

  const offline1 = new Projection(80, base)
  const branch1 = [
    offline1.insert(['offline-1-1'], offline1.projectionFrameCount),
    offline1.insert(['offline-trash'], offline1.projectionFrameCount),
    offline1.remove(offline1.projectionFrameCount - 1),
    offline1.insert(['offline-1-2'], offline1.projectionFrameCount),
  ]
  const offline2 = new Projection(70, base)
  const branch2 = [
    offline2.insert(['offline-2-1'], offline2.projectionFrameCount),
    offline2.insert(['offline-old'], offline2.projectionFrameCount),
    offline2.replace(['offline-2-2'], offline2.projectionFrameCount - 1),
  ]
  const offline3 = new Projection(60, base)
  const branch3 = [
    offline3.insert(['offline-3-1'], offline3.projectionFrameCount),
    offline3.insert(['offline-trash'], offline3.projectionFrameCount),
    offline3.remove(offline3.projectionFrameCount - 1),
    offline3.insert(['offline-old'], offline3.projectionFrameCount),
    offline3.replace(['offline-3-2'], offline3.projectionFrameCount - 1),
  ]

  return { base, online, offline: [branch1, branch2, branch3] }
}

const offlineDuringOnline = ({ online, offline }) => {
  const pending = offline.flatMap((branch) => [...branch].reverse())
  const result = []
  let offlineIndex = 0
  for (let onlineIndex = 0; onlineIndex < online.length; ++onlineIndex) {
    result.push(online[onlineIndex])
    const remainingOnline = online.length - onlineIndex
    const take = Math.ceil(
      (pending.length - offlineIndex) / (remainingOnline + 1)
    )
    result.push(...pending.slice(offlineIndex, offlineIndex + take))
    offlineIndex += take
  }
  result.push(...pending.slice(offlineIndex))
  return result
}

const offlineLifecycle = () =>
  run('offline realtime lifecycle', () => {
    const scenario = lifecycleScenario()
    const mutations = [...scenario.online, ...scenario.offline.flat()]
    const chronological = deliver(scenario.base, mutations)
    const midSession = deliver(scenario.base, offlineDuringOnline(scenario))
    const reverse = deliver(scenario.base, [...mutations].reverse())
    let failingShuffle
    let failingSeed

    for (let index = 0; index < 64; ++index) {
      const seed = (0xc0ff_ee00 + index) >>> 0
      const candidate = deliver(scenario.base, shuffled(mutations, seed))
      if (firstDifference(chronological, candidate)) {
        failingShuffle = candidate
        failingSeed = seed
        break
      }
    }

    return {
      note: `Ensimmäinen löydetty shuffle seed: ${failingSeed ?? 'ei eroa tällä ajolla'}.`,
      stages: [
        stage('six editor lifecycle orders', [
          replica('this / chronological', chronological),
          replica('peer / offline during online', midSession),
          replica('peer / reverse', reverse),
          ...(failingShuffle
            ? [replica(`peer / shuffled ${failingSeed}`, failingShuffle)]
            : []),
        ]),
      ],
    }
  })

const localRemoteReplacement = () =>
  run('local remote replacement equivalence', () => {
    const state = new Projection(1)
    const peer = new Projection(2)
    state.increaseClock[0] = 1001
    state.decreaseClock[0] = 2001
    peer.increaseClock[0] = 1002
    peer.decreaseClock[0] = 2002
    const strips = new StripIndex()
    const random = new Random(
      deriveSeed(
        deriveSeed(seedFromString('sequencer-lifecycle-v1'), 'run:0'),
        'shared-replica-workload'
      )
    )
    let nextId = 1
    let operation = 'initial'
    let error

    const createStrip = (length) => {
      const id = nextId++
      const frameCount = length ?? random.inclusive(1, 100)
      return { id, length: frameCount, values: new Array(frameCount).fill(id) }
    }

    const send = (label, author, receiver, update) => {
      operation = label
      gossip(author, receiver, update)
      assertEquivalent(author, receiver)
    }

    try {
      for (let stepIndex = 0; stepIndex < 100; ++stepIndex) {
        const insertionIndex = strips.count % 2 === 0 ? strips.count : 0
        const inserted = createStrip()
        send(
          `step ${stepIndex} insert`,
          state,
          peer,
          state.insert(inserted.values, strips.frameOffsetAt(insertionIndex))
        )
        strips.insert(insertionIndex, inserted)
        state.value(random.integer(strips.frameCount))

        const replacementIndex = random.integer(strips.count)
        const replacementFrame = strips.frameOffsetAt(replacementIndex)
        const replacement = createStrip(strips.at(replacementIndex).length)
        send(
          `step ${stepIndex} replace`,
          state,
          peer,
          state.replace(
            replacement.values,
            replacementFrame,
            replacementFrame + replacement.length - 1
          )
        )
        strips.replace(replacementIndex, replacement)

        const removalIndex = random.integer(strips.count)
        const removalFrame = strips.frameOffsetAt(removalIndex)
        const removed = strips.at(removalIndex)
        send(
          `step ${stepIndex} remove`,
          state,
          peer,
          state.remove(removalFrame, removalFrame + removed.length - 1)
        )
        strips.remove(removalIndex)

        const randomInsertionIndex = random.integer(strips.count + 1)
        const randomInsertion = createStrip()
        send(
          `step ${stepIndex} random insert`,
          state,
          peer,
          state.insert(
            randomInsertion.values,
            strips.frameOffsetAt(randomInsertionIndex)
          )
        )
        strips.insert(randomInsertionIndex, randomInsertion)

        const ingestIndex = random.integer(strips.count)
        const ingestFrame = strips.frameOffsetAt(ingestIndex)
        const ingested = createStrip(strips.at(ingestIndex).length)
        send(
          `step ${stepIndex} peer replace`,
          peer,
          state,
          peer.replace(
            ingested.values,
            ingestFrame,
            ingestFrame + ingested.length - 1
          )
        )
        strips.replace(ingestIndex, ingested)
      }
    } catch (caught) {
      error = caught
    }

    return {
      error,
      note: `Ensimmäinen epäonnistuva operaatio: ${operation}.`,
      stages: [
        stage('deterministic 100-step workload', [
          replica('this / local path', state),
          replica('peer / apply path', peer),
        ]),
      ],
    }
  })

const liveScaleDown = () =>
  run('live scale down gossip', () => {
    const state = new Projection(3)
    const peer = new Projection(4)
    state.decreaseClock[0] = 3952081492
    peer.decreaseClock[0] = 1468193293
    const strips = new StripIndex()
    const random = new Random(
      deriveSeed(seedFromString('sequencer-lifecycle-v1'), 'warmup')
    )
    let nextId = 1
    let operation = 'initial'
    let error

    const send = (label, author, receiver, update) => {
      operation = label
      gossip(author, receiver, update)
      assertEquivalent(state, peer)
    }
    const replacement = (length) => new Array(length).fill(nextId++)
    const insertAt = (index, label) => {
      const frame = strips.frameOffsetAt(index)
      const id = nextId++
      const length = random.inclusive(1, 100)
      send(label, state, peer, state.insert(new Array(length).fill(id), frame))
      strips.insert(index, { id, length })
    }
    const removeAt = (index, label) => {
      const frame = strips.frameOffsetAt(index)
      const item = strips.at(index)
      send(label, state, peer, state.remove(frame, frame + item.length - 1))
      strips.remove(index)
    }
    const primary = (label) => {
      state.value(random.integer(strips.frameCount))
      let index = random.integer(strips.count)
      let frame = strips.frameOffsetAt(index)
      let item = strips.at(index)
      let footage = replacement(item.length)
      send(
        `${label} replace`,
        state,
        peer,
        state.replace(footage, frame, frame + item.length - 1)
      )
      strips.replace(index, { id: footage[0], length: footage.length })
      removeAt(random.integer(strips.count), `${label} remove`)
      insertAt(random.integer(strips.count + 1), `${label} insert`)
    }
    const peerReplacement = (label) => {
      const index = random.integer(strips.count)
      const frame = strips.frameOffsetAt(index)
      const footage = replacement(strips.at(index).length)
      send(
        `${label} peer replace`,
        peer,
        state,
        peer.replace(footage, frame, frame + footage.length - 1)
      )
      strips.replace(index, { id: footage[0], length: footage.length })
    }

    try {
      for (let stepIndex = 0; stepIndex < 8; ++stepIndex) {
        insertAt(
          strips.count % 2 === 0 ? strips.count : 0,
          `warmup ${stepIndex}`
        )
        primary(`warmup ${stepIndex}`)
        peerReplacement(`warmup ${stepIndex}`)
      }
      let round = 0
      while (strips.count > 0) {
        primary(`scale-down ${round}`)
        removeAt(
          strips.count % 2 === 0 ? 0 : strips.count - 1,
          `scale-down ${round} edge remove`
        )
        if (strips.count > 0) peerReplacement(`scale-down ${round}`)
        ++round
      }
    } catch (caught) {
      error = caught
    }

    return {
      error,
      note: `Ensimmäinen epäonnistuva operaatio: ${operation}.`,
      stages: [
        stage('live shrinking peers', [
          replica('this / state', state),
          replica('peer', peer),
        ]),
      ],
    }
  })

export const scenarios = [
  liveScaleDown,
  liveReplaceThenRemove,
  concurrentReplacement,
  sameActor,
  overlappingGate,
  unorderedReplace,
  overlappingOwnership,
  tailReplaceRemove,
  localRemoteReplacement,
  liveUnobserved,
  offlineLifecycle,
]
