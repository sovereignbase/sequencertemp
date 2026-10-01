import { scenarios } from './scenarios.js?v=4'

const app = document.querySelector('#app')

const element = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

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

const formatOperation = (operation, formatValue) => {
  if (!operation) return 'gossip'

  if (operation.method === 'insert')
    return `insert([${operation.args[0].map(formatValue).join(', ')}], ${operation.args[1]})`

  if (operation.method === 'remove')
    return `remove(${operation.args
      .filter((value) => value !== undefined)
      .join(', ')})`

  if (operation.method === 'replace')
    return `replace([${operation.args[0].map(formatValue).join(', ')}], ${operation.args
      .slice(1)
      .filter((value) => value !== undefined)
      .join(', ')})`

  if (operation.method === 'apply' || operation.method === 'merge')
    return `${operation.method}(${formatOperation(operation.source, formatValue)})`

  if (operation.method === 'acknowledgements') return 'acknowledgements'
  if (operation.method === 'sequence') return 'sequence()'
  return operation.method
}

const boundary = (strip, offset) => {
  const diff = strip.fragmentDiff ?? strip.insertionDiff
  return `{${diff < 0 ? 'M' : 'L'}${strip.insertionStart + offset}}`
}

const stripText = (strip, formatValue) => {
  const diff = strip.fragmentDiff ?? strip.insertionDiff
  const start = strip.fragmentStart ?? 0
  let text = boundary(strip, start)

  for (let index = 0; index < Math.abs(diff); ++index) {
    const offset = start + index
    text += `[${offset}]=${formatValue(strip.footage?.[offset])}`
    text += boundary(strip, offset + 1)
  }

  return text
}

const renderSnapshot = (snapshot, formatValue) => {
  const container = element('section', 'replica')
  container.append(element('h3', '', snapshot.label))

  for (const strip of snapshot.strips)
    container.append(element('div', 'strip', stripText(strip, formatValue)))

  const values = snapshot.visible.map(formatValue)
  container.append(element('div', 'values', JSON.stringify(values)))
  container.append(element('div', 'value-walk', values.join(' ')))
  return container
}

const renderScenario = (container, scenario) => {
  const timeline = element('div', 'stages')
  const formatValue = makeValueFormatter()

  scenario.trace.forEach((step, index) => {
    const column = element('section', 'stage')
    column.append(
      element(
        'h2',
        '',
        `${index + 1}. ${formatOperation(step.operation, formatValue)}`
      )
    )

    for (const snapshot of step.replicas)
      column.append(renderSnapshot(snapshot, formatValue))

    timeline.append(column)
  })

  container.append(timeline)
}

for (const buildScenario of scenarios) {
  const details = element('details', 'test')
  const fallbackName = buildScenario.name
    .replaceAll(/([A-Z])/g, ' $1')
    .replace(/^./, (character) => character.toUpperCase())
  const summary = element('summary', '', fallbackName)
  const content = element('div', 'test-content', 'Avaa timeline')
  details.append(summary, content)

  details.addEventListener('toggle', () => {
    if (!details.open || details.dataset.loaded) return
    details.dataset.loaded = 'true'

    requestAnimationFrame(() => {
      const scenario = buildScenario()
      summary.textContent = scenario.title
      content.replaceChildren()
      renderScenario(content, scenario)
    })
  })

  app.append(details)
}
