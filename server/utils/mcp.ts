/**
 * Extract specific h2 sections from markdown content.
 * Always includes the title (h1) and description (first blockquote).
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

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection && normalizedTitles.includes(currentSection.toLowerCase())) {
        result.push(...sectionContent)
        result.push('')
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
  }

  return result.join('\n').trim()
}
