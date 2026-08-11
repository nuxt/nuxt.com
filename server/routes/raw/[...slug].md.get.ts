import { renderMarkdown } from 'comark/render'
import { withLeadingSlash } from 'ufo'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || ''
  if (!slug) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  let path = withLeadingSlash(slug.replace(/\.md$/, ''))
  if (path.endsWith('/index')) {
    path = path.slice(0, -6) || '/'
  }

  const file = await content.get(path)
  if (!file) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  const data = (file.data || {}) as Record<string, any>
  const nodes = [...(file.nodes as unknown[][])]

  if ((nodes[0] as unknown[] | undefined)?.[0] !== 'h1') {
    if (data.description) nodes.unshift(['blockquote', {}, data.description])
    if (data.title) nodes.unshift(['h1', {}, data.title])
  }

  const links = data.links || file.meta?.links
  if (Array.isArray(links) && links.length > 0) {
    const linkItems = links
      .filter((link: { label?: string, to?: string }) => link.label && link.to)
      .map((link: { label: string, to: string }) => ['li', {}, ['a', { href: link.to }, link.label]])
    if (linkItems.length > 0) {
      nodes.push(['hr', {}])
      nodes.push(['ul', {}, ...linkItems])
    }
  }

  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  return renderMarkdown({ nodes, frontmatter: data, meta: file.meta } as any)
})
