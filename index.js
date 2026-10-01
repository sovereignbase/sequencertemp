import { Projection } from './dist/class.js'

document.body.style.cssText = `
display: flex;
justify-content: flex-start;
align-items: flex-start;
gap:2rem;
`

let projection = new Projection(1)

const content = [0, 1, 2]

projection.insert(['a', 'b', 'c'], 0)

export function render(name) {
  const topContainer = document.createElement('div')
  topContainer.style.cssText = `
    width: max-content;
    height: max-content;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    padding: 1rem;
    `
  let cursor = projection.head
  for (let i = 0; i < projection.structuralStripCount; i++) {
    if (!cursor) break
    const container = document.createElement('div')
    container.style.cssText = `
    width: max-content;
    height: max-content;
    border: solid 1px red;
    font-weight: bold;
    `
    let logical = cursor.insertionStart + (cursor.fragmentStart ?? 0)
    let footageOffset = cursor.fragmentStart ?? 0
    const target =
      logical + Math.abs(cursor.fragmentDiff ?? cursor.insertionDiff) + 1

    while (logical < target) {
      if (logical !== cursor.insertionStart + cursor.fragmentStart)
        void container.appendChild(
          document.createTextNode(
            `{${(cursor.fragmentDiff ?? cursor.insertionDiff) < 0 ? 'M' : 'L'}` +
              String(logical) +
              '}'
          )
        )

      if (logical <= target - 2)
        void container.appendChild(
          document.createTextNode(
            '[' +
              String(footageOffset) +
              ']=' +
              cursor?.footage?.[footageOffset] ?? 'undefined'
          )
        )

      logical++
      footageOffset++
    }
    void topContainer.appendChild(container)
    cursor = cursor.rightStep
  }
  void topContainer.appendChild(document.createTextNode(name ?? ''))
  const valuesContainer = document.createElement('div')
  valuesContainer.style.cssText = `
    width: max-content;
    height: max-content;
    border: solid 1px blue;
    font-weight: bold;
    `
  void valuesContainer.appendChild(
    document.createTextNode(JSON.stringify(projection.values()))
  )
  void topContainer.appendChild(valuesContainer)

  const valueContainer = document.createElement('div')
  valueContainer.style.cssText = `
    width: max-content;
    height: max-content;
    border: solid 1px green;
    font-weight: bold;
    `
  for (let i = 0; i < projection.length(); i++)
    void valueContainer.appendChild(
      document.createTextNode(projection.value(i) + ' ')
    )
  void topContainer.appendChild(valueContainer)

  void document.body.appendChild(topContainer)
}

render('insert([a, b, c], 0)')

projection.insert(['d', 'e', 'f'], 3)
render('insert([d, e, f], 3)')

projection.insert(['g', 'h', 'i'], 0)
render('insert([g, h, i], 0)')

projection.insert(['j', 'k', 'l'], 3)
render('insert([j, k, l], 3)')

projection.insert(['m', 'n', 'o'], 5)
render('insert([m, n, o], 5)')

projection.insert(['p', 'q', 'r'], projection.length())
render('insert([p, q, r], projection.length())')

projection.insert(['s', 't', 'u'], 0)
render('insert([s, t, u], 0)')

projection.replace(['v', 'w', 'x'], 0, 2)
render('replace([v, w, x], 0, 2)')

projection.remove(0, 2)
render('remove(0, 2)')

projection.remove(5, 8)
render('remove(5, 8)')

projection.replace(['y', 'z'], 10, 11)
render('replace([y, z], 10, 11)')

projection = new Projection(1, projection.sequence())
render('new Projection(projection.sequence())')

let peer = new Projection(2, projection.sequence())

projection.apply(peer.insert(['A', 'B', 'C'], 0))
render('apply(peer.insert([A, B, C], 0))')

projection.apply(peer.replace(['D', 'E', 'F'], 2, 3))
render('apply(peer.replace([D, E, F], 2, 3))')

const gossip1 = projection.insert(['1', '2', '3'], 8)
projection.apply(peer.insert(['G', 'H', 'I'], 8))
peer.apply(gossip1)
render(`insert([1, 2, 3], 8) \n apply(peer.insert([G, H, I], 8))`)

const gossip2 = projection.remove(5, 8)
projection.apply(peer.remove(6, 9))
peer.apply(gossip2)
render(
  `remove(5, 8) \n apply(peer.remove(6, 9)) \n\n ${JSON.stringify(peer.values())}`
)

const gossip3 = projection.replace(['4', '5', '6'], 0, 7)
projection.apply(peer.replace(['J', 'K', 'L'], 5, 12))
peer.apply(gossip3)
render(
  `replace([4, 5, 6], 0, 7) \n apply(peer.replace([J, K, L], 5, 12))\n\n ${JSON.stringify(peer.values())}`
)

const gossip4 = projection.replace(['7', '8', '9'], 0, 2)
projection.apply(peer.replace(['M', 'N', 'O'], 0, 2))
peer.apply(gossip4)
render(
  `replace([7, 8, 9], 0, 2) \n apply(peer.replace([M, N, O], 0, 2))\n\n ${JSON.stringify(peer.values())}`
)

projection = new Projection(1, peer.sequence())
peer = new Projection(2, peer.sequence())
const projectionContainer1 = document.createElement('div')
projectionContainer1.replaceChildren(
  document.createTextNode(JSON.stringify(projection.values())),
  document.createTextNode(JSON.stringify(projection.sequence())),
  document.createTextNode(`new Projection(1, peer.sequence())`)
)
document.body.appendChild(projectionContainer1)
const peerContainer1 = document.createElement('div')
peerContainer1.replaceChildren(
  document.createTextNode(JSON.stringify(peer.values())),
  document.createTextNode(JSON.stringify(peer.sequence())),
  document.createTextNode(`new Projection(2, peer.sequence())`)
)
document.body.appendChild(peerContainer1)

peer.apply(projection.merge(peer.sequence())?.[1])
projection.apply(peer.merge(projection.sequence())?.[1])

const projectionContainer2 = document.createElement('div')
projectionContainer2.replaceChildren(
  document.createTextNode(JSON.stringify(projection.values())),
  document.createTextNode(JSON.stringify(projection.sequence())),
  document.createTextNode(`peer.apply(projection.merge(peer.sequence())?.[1])`)
)

document.body.appendChild(projectionContainer2)
const peerContainer2 = document.createElement('div')
peerContainer2.replaceChildren(
  document.createTextNode(JSON.stringify(peer.values())),
  document.createTextNode(JSON.stringify(peer.sequence())),
  document.createTextNode(
    `projection.apply(peer.merge(projection.sequence())?.[1])`
  )
)
document.body.appendChild(peerContainer2)
