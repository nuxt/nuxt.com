import type { ContentInstanceKey } from '#shared/utils/content'

/**
 * Fetch a page and render it as markdown
 *
 * Mirrors `/raw/<path>.md`, sharing its renderer.
 */
export async function fetchPageMarkdown(instance: ContentInstanceKey, path: string): Promise<string | null> {
  const content = await getInstance(instance)

  return renderPageMarkdown(content, path, { links: true })
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
