import type { Node, Renderer } from '@takumi-rs/core'

interface CopyOptions {
  width: number
  maxHeight: number
  maxSize: number
  minSize?: number
  family?: string
  lineHeight?: number
  letterSpacing?: number
}

export async function fitTemplateOgCopy(renderer: Renderer, input: string, options: CopyOptions) {
  const { width, maxHeight, maxSize, minSize = maxSize, family = 'Inter', lineHeight = 1.4, letterSpacing = 0 } = options
  const text = input.replace(/\s+/gu, ' ').trim()
  const measure = async (value: string, size: number) => {
    const style: NonNullable<Node['style']> = { width, fontFamily: family, fontWeight: family === 'Outfit' ? 500 : 400, fontSize: size, lineHeight, letterSpacing }
    const measured = await renderer.measure({ type: 'container', style: { width, display: 'flex', flexDirection: 'column' }, children: [{ type: 'text', text: value, style }] }, { width: 1200, height: 630 })
    const node = measured.children[0]!
    return { text: value, style, height: node.height, fits: node.height <= maxHeight && node.runs.every(run => run.x >= -1 && run.x + run.width <= width + 1) }
  }
  for (let size = maxSize; size >= minSize; size -= 2) {
    const result = await measure(text, size)
    if (result.fits) return result
  }
  const characters = Array.from(text)
  let low = 0
  let high = characters.length
  let best = await measure('…', minSize)
  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    const prefix = characters.slice(0, middle).join('')
    const lastSpace = prefix.lastIndexOf(' ')
    const candidate = (lastSpace > prefix.length * 0.65 ? prefix.slice(0, lastSpace) : prefix).replace(/[\s,;:.!?-]+$/u, '') + '…'
    const result = await measure(candidate, minSize)
    if (result.fits) {
      best = result
      low = middle + 1
    } else high = middle - 1
  }
  return best
}

export function findTemplateOgNode(node: Node, name: string): Node | undefined {
  if (node.tw?.split(/\s+/).includes(name)) return node
  if (node.type === 'container') {
    for (const child of node.children ?? []) {
      const match = findTemplateOgNode(child, name)
      if (match) return match
    }
  }
}

export async function layoutTemplateOg(renderer: Renderer, root: Node) {
  const heading = findTemplateOgNode(root, 'template-og-heading')
  const summary = findTemplateOgNode(root, 'template-og-summary')
  const credit = findTemplateOgNode(root, 'template-og-credit')
  const meta = findTemplateOgNode(root, 'template-og-meta')
  const preview = findTemplateOgNode(root, 'template-og-preview')
  if (heading?.type !== 'text' || summary?.type !== 'text' || credit?.type !== 'text' || !meta || !preview) return

  const title = await fitTemplateOgCopy(renderer, heading.text, { width: 880, maxHeight: 168, maxSize: 88, minSize: 56, family: 'Outfit', lineHeight: 1.06, letterSpacing: -2.1 })
  const description = await fitTemplateOgCopy(renderer, summary.text, { width: 1000, maxHeight: 72, maxSize: 25 })
  const attribution = await fitTemplateOgCopy(renderer, credit.text, { width: 312, maxHeight: 62, maxSize: 20, minSize: 18 })
  const summaryTop = 55 + title.height + 20
  const previewTop = Math.max(292, Math.ceil(summaryTop + description.height + 40))
  heading.text = title.text
  heading.style = { ...heading.style, ...title.style, height: title.height }
  summary.text = description.text
  summary.style = { ...summary.style, ...description.style, top: summaryTop, height: description.height }
  credit.text = attribution.text
  credit.style = { ...credit.style, ...attribution.style, top: previewTop + 58, height: attribution.height }
  meta.style = { ...meta.style, top: previewTop }
  preview.style = { ...preview.style, top: previewTop }
}
