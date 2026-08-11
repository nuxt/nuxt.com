import { renderMarkdown } from 'comark/render'
import type { DocsSource } from './content'

type SourceName = DocsSource | 'local'

/**
 * Fetches a page from a known content source and renders it as markdown.
 *
 * Mirrors the output of `/raw/<path>.md` — rendered markdown body with the
 * title/description prepended and resource links appended.
 */
export async function fetchPageMarkdown(
  _event: unknown,
  source: string,
  path: string
): Promise<string | null> {
  const file = await content.get(path)
  if (!file) return null

  // Verify source matches when specified (docs versions)
  if (source && source !== 'local' && file.meta?.source !== source) {
    // Try listing and matching by path within the specific source
    const items = await content.list([source as SourceName])
    const match = items.find(i => i.path === path)
    if (!match) return null
    const fullFile = await content.get(path)
    if (!fullFile) return null
    return renderFile(fullFile)
  }

  return renderFile(file)
}

function renderFile(file: { data?: Record<string, any>, nodes?: unknown[], meta?: Record<string, any> }): Promise<string> {
  const data = (file.data || {}) as Record<string, any>
  const nodes = [...((file.nodes || []) as unknown[][])]

  if ((nodes[0] as unknown[] | undefined)?.[0] !== 'h1') {
    if (data.description) nodes.unshift(['blockquote', {}, data.description])
    if (data.title) nodes.unshift(['h1', {}, data.title])
  }

  const links = data.links || file.meta?.links
  if (Array.isArray(links) && links.length > 0) {
    const items = links
      .filter((link: { label?: string, to?: string }) => Boolean(link.label && link.to))
      .map((link: { label: string, to: string }) => ['li', {}, ['a', { href: link.to }, link.label]])
    if (items.length > 0) {
      nodes.push(['hr', {}])
      nodes.push(['ul', {}, ...items])
    }
  }

  return renderMarkdown({ nodes, frontmatter: data, meta: file.meta } as any)
}

/**
 * Extract specific h2 sections from markdown content.
 * Always includes the title (h1) and description (first blockquote).
 * If no requested section matches, returns the full markdown to avoid
 * round-tripping (the model would otherwise refetch with no `sections`).
 */
export function extractSections(markdown: string, sectionTitles: string[]): string {
  const lines = markdown.split('\n')
  const result: string[] = []

  const normalizedTitles = sectionTitles.map(t => t.toLowerCase().trim())

  let inHeader = true
  for (const line of lines) {
    if (inHeader) {
      result.push(line)
      if (line.startsWith('>') && result.length > 1) {
        result.push('')
        inHeader = false
      }
      continue
    }
    break
  }

  let currentSection: string | null = null
  let sectionContent: string[] = []
  let matchedAny = false

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection && normalizedTitles.includes(currentSection.toLowerCase())) {
        result.push(...sectionContent)
        result.push('')
        matchedAny = true
      }
      currentSection = line.replace('## ', '').trim()
      sectionContent = [line]
      continue
    }

    if (currentSection) {
      sectionContent.push(line)
    }
  }

  if (currentSection && normalizedTitles.includes(currentSection.toLowerCase())) {
    result.push(...sectionContent)
    matchedAny = true
  }

  if (!matchedAny) return markdown

  return result.join('\n').trim()
}
