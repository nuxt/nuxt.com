import type { BlogSearchDocument, BlogSearchResult, BlogSearchSection } from '#shared/types'

const SNIPPET_BEFORE = 60
const SNIPPET_LENGTH = 200
const MAX_RESULTS = 20

export const BLOG_SEARCH_MIN_LENGTH = 2

interface PreparedSection {
  section: BlogSearchSection
  heading: string
  text: string
  code: string
}

export interface PreparedBlogDocument {
  post: BlogSearchDocument
  title: string
  description: string
  authors: string
  sections: PreparedSection[]
}

export function splitSearchTerms(query: string) {
  return query.toLowerCase().split(/\s+/).filter(Boolean)
}

/** Splits text around the query terms so matches can be wrapped in `<mark>`. */
export function highlightParts(text: string, query: string) {
  const terms = splitSearchTerms(query)
  if (!terms.length) return [{ text, match: false }]
  const source = terms.map(term => searchTextRegExp(term).source).join('|')
  const isMatch = new RegExp(`^(?:${source})$`, 'i')
  return text.split(new RegExp(`(${source})`, 'gi')).filter(Boolean).map(part => ({ text: part, match: isMatch.test(part) }))
}

/** Lowercases the index once, so each keystroke only scans it. */
export function prepareBlogSearchIndex(index: BlogSearchDocument[]): PreparedBlogDocument[] {
  return index.map(post => ({
    post,
    title: post.title.toLowerCase(),
    description: post.description.toLowerCase(),
    authors: post.authors.toLowerCase(),
    sections: post.sections.map(section => ({
      section,
      heading: (section.title ?? '').toLowerCase(),
      text: section.text.toLowerCase(),
      code: section.code.toLowerCase()
    }))
  }))
}

function count(haystack: string, term: string) {
  let total = 0
  for (let index = haystack.indexOf(term); index !== -1; index = haystack.indexOf(term, index + term.length)) total++
  return total
}

function snippet(text: string, lowerText: string, term: string) {
  const index = lowerText.indexOf(term)
  if (index === -1) return text.slice(0, SNIPPET_LENGTH)
  let start = Math.max(0, index - SNIPPET_BEFORE)
  if (start > 0) start = text.indexOf(' ', start) + 1 || start
  const end = Math.min(text.length, start + SNIPPET_LENGTH)
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`
}

/** Ranks blog posts for `query`: title and description first, then the best matching section. */
export function searchBlog(index: PreparedBlogDocument[], query: string): BlogSearchResult[] {
  if (query.trim().length < BLOG_SEARCH_MIN_LENGTH) return []
  const terms = splitSearchTerms(query)

  const results: (BlogSearchResult & { score: number })[] = []
  for (const doc of index) {
    const found = (term: string) => doc.title.includes(term) || doc.description.includes(term) || doc.authors.includes(term)
      || doc.sections.some(item => item.heading.includes(term) || item.text.includes(term) || item.code.includes(term))
    if (!terms.every(found)) continue

    let best: PreparedSection & { score: number } | undefined
    for (const item of doc.sections) {
      const score = terms.reduce((total, term) =>
        total + (item.heading.includes(term) ? 5 : 0) + Math.min(count(item.text, term), 5) + Math.min(count(item.code, term), 3), 0)
      if (score > 0 && (!best || score > best.score)) best = { ...item, score }
    }

    const inHeader = terms.every(term => doc.title.includes(term) || doc.description.includes(term))
    const score = terms.reduce((total, term) => total + (doc.title.includes(term) ? 20 : 0) + (doc.description.includes(term) ? 8 : 0), 0) + (best?.score ?? 0)
    const section = best && !inHeader ? best : undefined
    const proseTerm = section && terms.find(term => section.text.includes(term))
    const codeTerm = section && !proseTerm && !section.heading.includes(terms[0]!) && terms.find(term => section.code.includes(term))

    results.push({
      path: doc.post.path,
      score,
      section: section?.section.title && section.section.id ? { title: section.section.title, id: section.section.id } : undefined,
      snippet: !section
        ? doc.post.description
        : codeTerm
          ? snippet(section.section.code, section.code, codeTerm)
          : snippet(section.section.text, section.text, proseTerm ?? terms[0]!),
      code: Boolean(codeTerm) || undefined
    })
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map(({ score: _score, ...result }) => result)
}
