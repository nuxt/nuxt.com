import { renderMarkdown } from 'comark/render'
import type { ComarkContent, ContentFile } from 'comark-content'

interface PageLink {
  label?: string
  to?: string
}

/**
 * Render a page back to markdown, or `null` when nothing lives at `path`.
 */
export async function renderPageMarkdown(
  content: ComarkContent,
  path: string,
  opts: { links?: boolean } = {}
): Promise<string | null> {
  const item = await content.get(path)
  if (!item || item.meta.kind !== 'document') return null

  const sections: string[] = []
  const data = item.data as { title?: string, description?: string, links?: PageLink[] } | undefined

  // Pages whose body already opens with an `h1` carry their own title.
  if (!startsWithHeading(item)) {
    if (data?.title) sections.push(`# ${data.title}`)
    if (data?.description) sections.push(`> ${data.description}`)
  }

  const body = await renderMarkdown({ nodes: item.nodes })
  if (body.trim()) sections.push(body.trim())

  if (opts.links) {
    const links = (data?.links ?? []).filter(link => link.label && link.to)
    if (links.length) {
      sections.push('---', links.map(link => `- [${link.label}](${link.to})`).join('\n'))
    }
  }

  return `${sections.join('\n\n')}\n`
}

function startsWithHeading(item: ContentFile): boolean {
  const first = item.nodes?.[0]
  return Array.isArray(first) && first[0] === 'h1'
}

/** Page path → raw markdown URL (`/` → `/raw/index.md`). */
export function rawUrlForPage(path: string): string {
  return path === '/' ? '/raw/index.md' : `/raw/${path.replace(/^\//, '')}.md`
}

/** `/raw/**` slug (`docs/4.x/foo.md`) → page path (`/docs/4.x/foo`). */
export function pagePathFromRawSlug(slug: string): string {
  const stripped = slug.replace(/\.md$/, '')
  return stripped === 'index' ? '/' : `/${stripped}`
}
