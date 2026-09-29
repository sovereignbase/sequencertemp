import { Projection } from './dist/class.js'

document.body.style.cssText = `
display: flex;
justify-content: flex-start;
align-items: flex-start;
gap:2rem;
`

const projection = new Projection(1)

const content = [0, 1, 2]

projection.insert(content.slice(), 0)

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
    `
    let logical = cursor.insertionStart + (cursor.fragmentStart ?? 0)
    let footageOffset = cursor.fragmentStart ?? 0
    console.log(footageOffset)
    const target =
      logical + Math.abs(cursor.fragmentDiff ?? cursor.insertionDiff) + 1

    while (logical < target) {
      void container.appendChild(
        document.createTextNode('{L' + String(logical) + '}')
      )

      if (logical <= target - 2)
        void container.appendChild(
          document.createTextNode('[' + String(footageOffset) + ']')
        )

      logical++
      footageOffset++
    }
    void topContainer.appendChild(container)
    cursor = cursor.rightStep
  }
  void topContainer.appendChild(document.createTextNode(name ?? ''))
  void document.body.appendChild(topContainer)
}

render('insert([0, 1, 2], 0)')

projection.insert(content.slice(), 3)
render('insert([0, 1, 2], 3)')

projection.insert(content.slice(), 0)
render('insert([0, 1, 2], 0)')

projection.insert(content.slice(), 3)
render('insert([0, 1, 2], 3)')

projection.insert(content.slice(), 5)
render('insert([0, 1, 2], 5)')

projection.insert(content.slice(), projection.length())
render('insert([0, 1, 2], projection.length())')
