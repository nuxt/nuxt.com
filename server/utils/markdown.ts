import { createMarkdownParser } from 'comark/parse'
import { renderMarkdown } from 'comark/render'
import type { ElementNode, Node } from 'comark'
import type { ContentFile } from 'comark-content'
import toc from 'comark/plugins/toc'
import shiki from 'comark/plugins/shiki'

/** Shared Comark parser used for module READMEs, releases, and code-explorer. */
export const parseMarkdown = createMarkdownParser({
  plugins: [
    toc({ depth: 3, searchDepth: 6 }),
    shiki()
  ]
})

/**
 * Renders a ContentFile back to markdown: prepends the frontmatter title and
 * description when the body has no leading h1, and appends `links` entries as
 * a resource list. Shared by `/raw/*.md`, the llms plugin and MCP tools.
 */
export function renderContentFile(file: Pick<ContentFile, 'data' | 'nodes' | 'meta'>): Promise<string> {
  const data = file.data || {}
  const nodes: Node[] = [...(file.nodes || [])]

  const first = nodes[0]
  if (!Array.isArray(first) || first[0] !== 'h1') {
    if (data.description) nodes.unshift(['blockquote', {}, String(data.description)])
    if (data.title) nodes.unshift(['h1', {}, String(data.title)])
  }

  const links = data.links || file.meta?.links
  if (Array.isArray(links) && links.length > 0) {
    const items = (links as Array<{ label?: string, to?: string }>)
      .filter((link): link is { label: string, to: string } => Boolean(link.label && link.to))
      .map((link): ElementNode => ['li', {}, ['a', { href: link.to }, link.label]])
    if (items.length > 0) {
      nodes.push(['hr', {}])
      nodes.push(['ul', {}, ...items])
    }
  }

  return renderMarkdown({ nodes, frontmatter: data, meta: file.meta })
}
