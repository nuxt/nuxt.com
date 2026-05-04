import type { H3Event } from 'h3'
import { stringify } from 'minimark/stringify'
import type { MinimarkNode } from 'minimark'
import { queryCollection } from '@nuxt/content/server'

type CollectionName = Parameters<typeof queryCollection>[1]

/**
 * Fetches a page from a known content collection and renders it as markdown.
 *
 * Mirrors the output of `/raw/<path>.md` (provided by `@nuxt/content`'s
 * `nuxt-llms` feature) — minimark-stringified body with the title/description
 * prepended and resource links appended — but skips its collection-iteration
 * lookup, which can throw or return 404 for `type: 'page'` collections that
 * aren't keyed by the requested path.
 */
export async function fetchPageMarkdown(
  event: H3Event,
  collection: CollectionName,
  path: string
): Promise<string | null> {
  const page = await queryCollection(event, collection).path(path).first() as
    | { title?: string, description?: string, body?: { value?: MinimarkNode[] }, links?: unknown[], meta?: { links?: unknown[] } }
    | null

  if (!page?.body?.value) return null

  const value: MinimarkNode[] = [...page.body.value]

  if ((value[0] as unknown[] | undefined)?.[0] !== 'h1') {
    if (page.description) value.unshift(['blockquote', {}, page.description])
    if (page.title) value.unshift(['h1', {}, page.title])
  }

  const links = page.links || page.meta?.links
  if (Array.isArray(links) && links.length > 0) {
    const items: MinimarkNode[] = links
      .filter((link): link is { label: string, to: string } => Boolean((link as { label?: string }).label && (link as { to?: string }).to))
      .map(link => ['li', {}, ['a', { href: link.to }, link.label]])
    if (items.length > 0) {
      value.push(['hr', {}])
      value.push(['ul', {}, ...items])
    }
  }

  return stringify({ type: 'minimark', value }, { format: 'markdown/html' })
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
