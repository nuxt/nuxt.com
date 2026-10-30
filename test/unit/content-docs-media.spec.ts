import { describe, expect, it } from 'vitest'
import { docsMedia } from '../../server/utils/content/plugins/docs-media'

/** Runs `docsMedia()`'s `file:parsed` hook over one element on the page at `stem`, returning its attributes. */
function rewriteNode(stem: string, tag: string, attrs: Record<string, unknown>): Record<string, unknown> {
  let onParsed: ((ctx: { file: unknown }) => void) | undefined
  docsMedia('/modules/devtools').setup!({ hooks: { hook: (_: string, fn: typeof onParsed) => (onParsed = fn) } } as never)

  const node: [string, Record<string, unknown>] = [tag, attrs]
  onParsed!({ file: { path: `/${stem}`, data: {}, meta: { key: `module/${stem}.md`, stem }, nodes: [['p', {}, node]] } })

  return node[1]
}

/** The `src` of one image on the page at `stem`, once rewritten. */
const rewrite = (stem: string, src: string): unknown => rewriteNode(stem, 'img', { src, alt: '' }).src

describe('docsMedia', () => {
  it('points a relative image at the media item, resolved against the page directory', () => {
    expect(rewrite('1.features', './images/overview.webp')).toBe('/modules/devtools/images/overview.webp')
    expect(rewrite('1.features', 'images/Overview.webp')).toBe('/modules/devtools/images/Overview.webp')
    expect(rewrite('2.guide/1.setup', '../images/overview.webp')).toBe('/modules/devtools/images/overview.webp')
    expect(rewrite('2.guide/1.setup', './shot.png?v=2')).toBe('/modules/devtools/2.guide/shot.png')
  })

  it('leaves absolute, root-relative and out-of-source images alone', () => {
    expect(rewrite('index', 'https://example.com/a.png')).toBe('https://example.com/a.png')
    expect(rewrite('index', '//example.com/a.png')).toBe('//example.com/a.png')
    expect(rewrite('index', '/assets/a.png')).toBe('/assets/a.png')
    expect(rewrite('index', '../playground/a.png')).toBe('../playground/a.png')
  })

  it('points a relative video and its poster at their media items', () => {
    expect(rewriteNode('2.guide/1.setup', 'video', { src: '../images/demo.mp4', poster: './poster.jpg', controls: true }))
      .toEqual({ src: '/modules/devtools/images/demo.mp4', poster: '/modules/devtools/2.guide/poster.jpg', controls: true })
    expect(rewriteNode('index', 'video', { src: 'https://example.com/demo.mp4' }).src).toBe('https://example.com/demo.mp4')
    expect(rewriteNode('index', 'video', { src: './demo.mp4#t=10,20' }).src).toBe('/modules/devtools/demo.mp4#t=10,20')
    expect(rewriteNode('index', 'video', { src: './demo.mp4?v=2#t=10' }).src).toBe('/modules/devtools/demo.mp4#t=10')
  })
})
