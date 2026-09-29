import { Projection } from './dist/class.js'

document.body.style.cssText = `
display: flex;
justify-content: flex-start;
align-items: flex-start;
gap:2rem;
`

const projection = new Projection(1)

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
  for (let i = 0; i < projection.length(); i++) {
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
  void topContainer.appendChild(document.createTextNode(projection.values()))

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
