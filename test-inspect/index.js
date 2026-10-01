import { scenarios } from './scenarios.js'

const app = document.querySelector('#app')

const element = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

const errorText = (error) =>
  error instanceof Error
    ? `${error.name}: ${error.message}\n${error.stack ?? ''}`
    : String(error)

const makeValueFormatter = () => {
  const aliases = new Map()

  const aliasAt = (index) => {
    let alias = ''
    do {
      alias = String.fromCharCode(97 + (index % 26)) + alias
      index = Math.floor(index / 26) - 1
    } while (index >= 0)
    return alias
  }

  return (value) => {
    if (value === undefined) return 'undefined'
    if (typeof value !== 'string') return value

    let alias = aliases.get(value)
    if (!alias) {
      alias = aliasAt(aliases.size)
      aliases.set(value, alias)
    }
    return alias
  }
}

const inspectReads = (projection) => {
  let values
  let valuesError
  let walk
  let walkError

  try {
    values = projection.values()
  } catch (error) {
    valuesError = error
  }

  try {
    walk = Array.from({ length: projection.projectionFrameCount }, (_, index) =>
      projection.value(index)
    )
  } catch (error) {
    walkError = error
  }

  return { values, valuesError, walk, walkError }
}

const firstDifference = (baseline, actual, formatValue) => {
  if (baseline.error || actual.error)
    return 'read error; katso sininen/vihreä tulos'
  if (baseline.walk.length !== actual.walk.length)
    return `length ${baseline.walk.length} !== ${actual.walk.length}`

  const index = actual.walk.findIndex(
    (value, position) => value !== baseline.walk[position]
  )

  return index === -1
    ? undefined
    : `position ${index}: ${formatValue(baseline.walk[index])} !== ${formatValue(actual.walk[index])}`
}

const boundary = (strip, offset) => {
  const diff = strip.fragmentDiff ?? strip.insertionDiff
  return `{${diff < 0 ? 'M' : 'L'}${strip.insertionStart + offset}}`
}

const stripText = (strip, formatValue) => {
  const diff = strip.fragmentDiff ?? strip.insertionDiff
  const start = strip.fragmentStart ?? 0
  const length = Math.abs(diff)
  let text = boundary(strip, start)

  for (let index = 0; index < length; ++index) {
    const offset = start + index
    const value = strip.footage?.[offset]
    text += `[${offset}]=${formatValue(value)}`
    text += boundary(strip, offset + 1)
  }

  return text
}

const renderProjection = (entry, baselineReads, index, formatValue) => {
  const { projection } = entry
  const card = element('section', 'replica')
  const reads = inspectReads(projection)
  const readShape = {
    walk: reads.walk,
    error: reads.valuesError ?? reads.walkError,
  }
  const difference =
    index === 0
      ? undefined
      : firstDifference(baselineReads, readShape, formatValue)

  if (index > 0) card.classList.add(difference ? 'mismatch' : 'match')
  card.append(element('h3', '', entry.label))

  const gateIndex = (() => {
    let at = 0
    const seen = new Set()
    for (
      let strip = projection.head;
      strip && !seen.has(strip);
      strip = strip.rightStep
    ) {
      if (strip === projection.gate) return at
      seen.add(strip)
      ++at
    }
    return -1
  })()

  const status = [
    `frames=${projection.projectionFrameCount}`,
    `strips=${projection.structuralStripCount}`,
    `gateStrip=${gateIndex}`,
    `projectedPosition=${projection.projectedPosition}`,
    difference
      ? `FIRST DIFFERENCE: ${difference}`
      : index > 0
        ? 'MATCH'
        : 'BASELINE',
    entry.note,
  ]
    .filter(Boolean)
    .join('\n')

  card.append(element('div', 'status', status))

  let strip = projection.head
  const seen = new Set()
  let stripIndex = 0

  while (strip && !seen.has(strip)) {
    seen.add(strip)
    const stripNode = element(
      'div',
      `strip${strip === projection.gate ? ' gate' : ''}`
    )
    const flags = [
      strip === projection.head ? 'H' : '',
      strip === projection.gate ? 'G' : '',
      strip === projection.tail ? 'T' : '',
    ]
      .filter(Boolean)
      .join('')
    stripNode.append(
      element('span', 'flags', `#${stripIndex}${flags ? `(${flags})` : ''} `),
      document.createTextNode(stripText(strip, formatValue))
    )
    stripNode.title = JSON.stringify({
      anchor: [strip.anchorSession, strip.anchorStart, strip.anchorDiff],
      insertion: [
        strip.insertionSession,
        strip.insertionStart,
        strip.insertionDiff,
      ],
      fragment: [strip.fragmentStart, strip.fragmentDiff],
      jumps: [
        strip.leftJumpFrameCount,
        strip.leftJumpStripCount,
        strip.rightJumpFrameCount,
        strip.rightJumpStripCount,
      ],
    })
    card.append(stripNode)
    strip = strip.rightStep
    ++stripIndex
  }

  if (strip)
    card.append(element('div', 'error', 'Structural orderissa on cycle.'))

  const valuesNode = element(
    'div',
    `values${reads.valuesError ? ' read-error' : ''}`,
    reads.valuesError
      ? `values() ERROR: ${errorText(reads.valuesError)}`
      : JSON.stringify(reads.values.map(formatValue))
  )
  card.append(valuesNode)

  const walkNode = element(
    'div',
    `value-walk${reads.walkError ? ' read-error' : ''}`,
    reads.walkError
      ? `value(i) ERROR: ${errorText(reads.walkError)}`
      : reads.walk.map(formatValue).join(' ')
  )
  card.append(walkNode)

  const sequence = element('details', 'sequence')
  sequence.append(element('summary', '', 'sequence()'))
  try {
    sequence.append(
      element(
        'pre',
        '',
        JSON.stringify(projection.sequence(), (_key, value) =>
          typeof value === 'string' ? formatValue(value) : value
        )
      )
    )
  } catch (error) {
    sequence.append(element('pre', 'error', errorText(error)))
  }
  card.append(sequence)

  return { card, reads: readShape }
}

const renderScenario = (container, scenario) => {
  if (scenario.note) container.append(element('p', 'note', scenario.note))
  if (scenario.error)
    container.append(element('pre', 'error', errorText(scenario.error)))

  const stages = element('div', 'stages')
  const formatValue = makeValueFormatter()

  for (const current of scenario.stages ?? []) {
    const stageNode = element('section', 'stage')
    stageNode.append(element('h2', '', current.title))
    if (current.note) stageNode.append(element('p', 'note', current.note))

    let baselineReads
    current.replicas.forEach((entry, index) => {
      const rendered = renderProjection(
        entry,
        baselineReads,
        index,
        formatValue
      )
      baselineReads ??= rendered.reads
      stageNode.append(rendered.card)
    })

    stages.append(stageNode)
  }

  container.append(stages)
}

for (const buildScenario of scenarios) {
  const details = element('details', 'test')
  const name = buildScenario.name
    .replaceAll(/([A-Z])/g, ' $1')
    .replace(/^./, (character) => character.toUpperCase())
  details.append(element('summary', '', name))
  const content = element(
    'div',
    'test-content',
    'Avaa skenaario suorittamalla…'
  )
  details.append(content)

  details.addEventListener(
    'toggle',
    () => {
      if (!details.open || details.dataset.loaded) return
      details.dataset.loaded = 'true'
      content.replaceChildren(element('p', 'note', 'Suoritetaan testiä…'))

      requestAnimationFrame(() => {
        const scenario = buildScenario()
        details.querySelector('summary').textContent = scenario.title
        content.replaceChildren()
        renderScenario(content, scenario)
      })
    },
    { passive: true }
  )

  app.append(details)
}
