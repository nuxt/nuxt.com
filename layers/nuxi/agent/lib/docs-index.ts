import { appOrigin } from './internal-api.js'

/** `llms.txt` sections whose pages are indexed: the current docs and the deploy guides. */
const INDEXED_SETS = ['Nuxt v4 Documentation', 'Deployment Guides']
const INDEX_TTL_MS = 60 * 60 * 1000
const FETCH_CONCURRENCY = 32
const FETCH_TIMEOUT_MS = 10_000

const BM25_K1 = 1.2
const BM25_B = 0.75
const TITLE_WEIGHT = 3
const HEADING_WEIGHT = 2

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'do', 'does', 'for', 'from', 'how', 'i', 'in', 'is', 'it',
  'my', 'of', 'on', 'or', 'should', 'that', 'the', 'this', 'to', 'use', 'using', 'what', 'when', 'where', 'which',
  'why', 'with', 'you', 'your', 'nuxt'
])

export interface DocPage {
  title: string
  /** Root-relative path, e.g. `/docs/4.x/getting-started/state-management`. */
  path: string
  description: string
}

interface DocSection {
  page: DocPage
  /** Heading trail inside the page, e.g. `['Best Practices', 'Shared state']`. */
  headings: string[]
  anchor: string
  text: string
  terms: Map<string, number>
  length: number
}

interface DocsIndex {
  pages: DocPage[]
  sections: DocSection[]
  documentFrequency: Map<string, number>
  averageLength: number
  loadedAt: number
}

export interface DocsHit {
  title: string
  path: string
  section: string
  url: string
  content: string
}

function stem(token: string): string {
  if (token.length > 4 && token.endsWith('ies')) return `${token.slice(0, -3)}y`
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1)
  return token
}

/**
 * Lowercased terms; camelCase identifiers also yield their parts (`useAsyncData` → `useasyncdata`, `async`, `data`),
 * and adjacent words yield a pair term (`instance unavailable` → `instance+unavailable`) so phrases outrank scattered words.
 */
export function tokenize(text: string): string[] {
  const out: string[] = []
  let previous: string | null = null
  for (const word of text.match(/[\w$]+/g) ?? []) {
    const lower = word.toLowerCase()
    if (STOP_WORDS.has(lower) || (lower.length < 2 && !/\d/.test(lower))) {
      previous = null
    } else {
      const term = stem(lower)
      out.push(term)
      if (previous) out.push(`${previous}+${term}`)
      previous = term
    }
    const parts = word.split(/(?<=[a-z0-9])(?=[A-Z])|_/).filter(part => part.length > 1)
    if (parts.length > 1) {
      for (const part of parts) {
        const p = part.toLowerCase()
        if (!STOP_WORDS.has(p)) out.push(stem(p))
      }
    }
  }
  return out
}

function slugify(heading: string): string {
  return heading.toLowerCase().replace(/`/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

export function parseLlmsIndex(text: string): DocPage[] {
  const pages: DocPage[] = []
  let indexed = false
  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) {
      indexed = INDEXED_SETS.includes(line.slice(3).trim())
      continue
    }
    if (!indexed) continue
    const match = line.match(/^- \[(.+?)\]\(https?:\/\/[^/]+\/raw(\/[^)]+?)\.md\)(?:: (.*))?$/)
    if (match) pages.push({ title: match[1]!, path: match[2]!, description: match[3]?.trim() ?? '' })
  }
  return pages
}

export function stripFrontmatter(markdown: string): string {
  return markdown.startsWith('---\n') ? markdown.slice(markdown.indexOf('\n---', 4) + 4).trimStart() : markdown
}

interface Fence {
  char: string
  length: number
}

/**
 * Code fence state after `line`. A fence closes only on the same character, at least as long as
 * the opener and with nothing after it, so a ```` ``` ```` inside a ````` ```` ````` block (or a `~~~` one) stays code.
 */
function trackFence(open: Fence | null, line: string): Fence | null {
  const marker = line.match(/^ {0,3}(`{3,}|~{3,})/)
  if (!marker) return open
  const run = marker[1]!
  if (!open) return { char: run[0]!, length: run.length }
  return run[0] === open.char && run.length >= open.length && !line.slice(marker[0].length).trim() ? null : open
}

/** Split on h2/h3 outside code fences; the intro before the first h2 is its own section. */
export function splitSections(markdown: string): { headings: string[], text: string }[] {
  const sections: { headings: string[], text: string }[] = []
  let h2 = ''
  let current: { headings: string[], lines: string[] } = { headings: [], lines: [] }
  let fence: Fence | null = null

  const flush = () => {
    const text = current.lines.join('\n').trim()
    if (text) sections.push({ headings: current.headings, text })
  }

  for (const line of markdown.split('\n')) {
    fence = trackFence(fence, line)
    const heading = fence ? null : line.match(/^(##|###) (.+)$/)
    if (heading) {
      flush()
      const title = heading[2]!.trim()
      if (heading[1] === '##') h2 = title
      current = { headings: heading[1] === '##' ? [title] : [h2, title].filter(Boolean), lines: [line] }
      continue
    }
    if (!line.startsWith('# ')) current.lines.push(line)
  }
  flush()
  return sections
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    return response.ok ? await response.text() : null
  } catch {
    return null
  }
}

async function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length })
  let next = 0
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i]!)
    }
  }))
  return results
}

export function buildIndex(pages: DocPage[], bodies: (string | null)[]): DocsIndex {
  const sections: DocSection[] = []
  const documentFrequency = new Map<string, number>()
  let totalLength = 0

  pages.forEach((page, i) => {
    const body = bodies[i]
    const parts = body ? splitSections(stripFrontmatter(body)) : [{ headings: [], text: page.description }]
    const titleTerms = tokenize(page.title)

    for (const part of parts) {
      const terms = new Map<string, number>()
      const add = (list: string[], weight: number) => {
        for (const term of list) terms.set(term, (terms.get(term) ?? 0) + weight)
      }
      add(tokenize(part.text), 1)
      add(titleTerms, TITLE_WEIGHT)
      add(tokenize(part.headings.join(' ')), HEADING_WEIGHT)
      if (!part.headings.length) add(tokenize(page.description), HEADING_WEIGHT)

      let length = 0
      for (const [term, count] of terms) {
        length += count
        documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1)
      }
      totalLength += length
      sections.push({
        page,
        headings: part.headings,
        anchor: part.headings.length ? slugify(part.headings.at(-1)!) : '',
        text: part.text,
        terms,
        length
      })
    }
  })

  return {
    pages,
    sections,
    documentFrequency,
    averageLength: sections.length ? totalLength / sections.length : 1,
    loadedAt: Date.now()
  }
}

let indexPromise: Promise<DocsIndex> | null = null
/** One background reload at a time once the TTL passes; the stale index keeps serving meanwhile. */
let refreshing: Promise<void> | null = null

async function loadIndex(): Promise<DocsIndex> {
  const origin = appOrigin()
  const llms = await fetchText(`${origin}/llms.txt`)
  if (!llms) throw new Error('Could not load the documentation index')
  const pages = parseLlmsIndex(llms)
  const bodies = await mapConcurrent(pages, FETCH_CONCURRENCY, page => fetchText(`${origin}/raw${page.path}.md`))
  return buildIndex(pages, bodies)
}

export function getDocsIndex(): Promise<DocsIndex> {
  if (!indexPromise) {
    indexPromise = loadIndex().catch((error) => {
      indexPromise = null
      throw error
    })
  } else if (!refreshing) {
    refreshing = indexPromise
      .then(async (index) => {
        if (Date.now() - index.loadedAt <= INDEX_TTL_MS) return
        indexPromise = Promise.resolve(await loadIndex())
      })
      .catch(() => {})
      .finally(() => {
        refreshing = null
      })
  }
  return indexPromise
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const kept = cut.slice(0, cut.lastIndexOf('\n') > max * 0.6 ? cut.lastIndexOf('\n') : max)
  const open = kept.split('\n').reduce<Fence | null>(trackFence, null)
  return `${kept}${open ? `\n${open.char.repeat(open.length)}` : ''}\n…`
}

export function searchIndex(index: DocsIndex, query: string, options: { limit: number, perSectionChars: number, prefix?: string }): DocsHit[] {
  const queryTerms = [...new Set(tokenize(query))]
  if (!queryTerms.length) return []
  const total = index.sections.length

  const scored: { section: DocSection, score: number }[] = []
  for (const section of index.sections) {
    if (options.prefix && !section.page.path.startsWith(options.prefix)) continue
    let score = 0
    let matched = 0
    for (const term of queryTerms) {
      const tf = section.terms.get(term)
      if (!tf) continue
      matched++
      const df = index.documentFrequency.get(term) ?? 0
      const idf = Math.log(1 + (total - df + 0.5) / (df + 0.5))
      score += idf * (tf * (BM25_K1 + 1)) / (tf + BM25_K1 * (1 - BM25_B + BM25_B * section.length / index.averageLength))
    }
    if (score > 0) scored.push({ section, score: score * (0.5 + matched / queryTerms.length) })
  }
  scored.sort((a, b) => b.score - a.score)

  const perPage = new Map<string, number>()
  const hits: DocsHit[] = []
  for (const { section } of scored) {
    const count = perPage.get(section.page.path) ?? 0
    if (count >= 2) continue
    perPage.set(section.page.path, count + 1)
    hits.push({
      title: section.page.title,
      path: section.page.path,
      section: section.headings.join(' › ') || 'Introduction',
      url: section.anchor ? `${section.page.path}#${section.anchor}` : section.page.path,
      content: truncate(section.text, options.perSectionChars)
    })
    if (hits.length >= options.limit) break
  }
  return hits
}
