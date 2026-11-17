import type { ToolUIPart, DynamicToolUIPart } from 'ai'
import { getToolName } from 'ai'
import { getSearchQuery, getSources } from '../utils/tool'
import { parsePromptCardOutput } from '../../shared/utils/ide-deeplinks'

export type ToolPart = ToolUIPart | DynamicToolUIPart

export type FeedbackOutput = { title: string, summary: string }

const VERBS: Record<string, [string, string]> = {
  list: ['Searching', 'Searched'],
  search: ['Searching', 'Searched'],
  find: ['Searching', 'Searched'],
  query: ['Searching', 'Searched'],
  get: ['Reading', 'Read'],
  read: ['Reading', 'Read'],
  fetch: ['Reading', 'Read'],
  show: ['Finding', 'Found'],
  open: ['Opening', 'Opened'],
  generate: ['Generating', 'Generated'],
  create: ['Creating', 'Created'],
  edit: ['Editing', 'Edited'],
  add: ['Adding', 'Added'],
  check: ['Checking', 'Checked']
}

/**
 * eve qualifies connection tools as `<connection>__<tool>`, so `get-module` on
 * the nuxt-mcp connection arrives as `nuxt-mcp__get-module`. Only the tool
 * segment carries meaning here: the verb heuristics, the icon map and the
 * module-card gates all key off it.
 *
 * Matching the `*-mcp` convention every file in `agent/connections/` follows
 * keeps this working when a connection is added, and deliberately leaves local
 * tools whose own name contains `__` alone — `ai_gateway__report` reads better
 * as "ai gateway report" than as "report".
 */
const CONNECTION_TOOL_RE = /^[a-z0-9-]+-mcp__(.+)$/

export function normalizeToolName(toolName: string): string {
  const tool = CONNECTION_TOOL_RE.exec(toolName)?.[1]
  return tool ? tool.replace(/_/g, '-') : toolName
}

export function isConnectionSearchTool(part: ToolPart): boolean {
  return getToolName(part) === 'connection_search'
}

function unwrapConnectionSearchResults(output: unknown): Array<Record<string, unknown>> | undefined {
  if (!output) return undefined
  if (typeof output === 'object' && output !== null && 'value' in output) {
    const value = (output as { value: unknown }).value
    if (Array.isArray(value)) return value as Array<Record<string, unknown>>
  }
  if (Array.isArray(output)) return output as Array<Record<string, unknown>>
  return undefined
}

export function getConnectionSearchSuffix(part: ToolPart): string | undefined {
  const input = (part.input || {}) as Record<string, unknown>
  const keywords = typeof input.keywords === 'string' ? input.keywords.trim() : ''
  if (!hasToolOutput(part)) return keywords || undefined

  const items = unwrapConnectionSearchResults(part.output)
  const toolNames = items?.map(item => item.tool).filter((name): name is string => typeof name === 'string' && name.length > 0) ?? []

  if (toolNames.length > 0) {
    return `${keywords ? `${keywords} · ` : ''}${toolNames.length} tools available`
  }

  return keywords || undefined
}

const SUFFIX_KEYS = [
  'search',
  'objective',
  'keywords',
  'query',
  'q',
  'term',
  'path',
  'slug',
  'title',
  'templateName',
  'componentName',
  'composableName',
  'name',
  'username',
  'repo',
  'section',
  'id'
]

function parseToolName(toolName: string): { verb?: [string, string], label: string } {
  const normalized = normalizeToolName(toolName)
  const parts = normalized.split(/[-_\s]+/).filter(Boolean)
  const head = parts[0]?.toLowerCase()

  if (head && VERBS[head] && parts.length > 1) {
    return { verb: VERBS[head], label: parts.slice(1).join(' ') }
  }

  return { label: parts.join(' ') || toolName }
}

type RichToolName = 'show_module' | 'show_template' | 'show_blog_post' | 'show_hosting' | 'show_nuxter' | 'open_playground' | 'report_issue' | 'show_prompt'

const RICH_TOOL_HEADERS = {
  show_module: { loading: 'Loading module', success: 'Found module', error: 'Module unavailable' },
  show_template: { loading: 'Loading templates', success: 'Found templates', error: 'Templates unavailable' },
  show_blog_post: { loading: 'Finding blog post', success: 'Found blog post', error: 'Blog post unavailable' },
  show_hosting: { loading: 'Loading provider', success: 'Found provider', error: 'Provider unavailable' },
  show_nuxter: { loading: 'Finding Nuxter', success: 'Found Nuxter', error: 'Nuxter unavailable' },
  open_playground: { loading: 'Generating playground', success: 'Playground ready', error: 'Playground unavailable' },
  report_issue: { loading: 'Preparing feedback form', success: 'Help us improve', error: 'Feedback form unavailable' },
  show_prompt: { loading: 'Preparing prompt', success: 'Ready to apply', error: 'Prompt unavailable' }
} as const satisfies Record<RichToolName, { loading: string, success: string, error: string }>

const LOOKUP_HEADERS = {
  search_docs: { loading: 'Searching Nuxt documentation', success: 'Searched Nuxt documentation', error: 'Documentation search unavailable' },
  read_page: { loading: 'Reading a page', success: 'Read page', error: 'Page unavailable' },
  search_modules: { loading: 'Searching Nuxt modules', success: 'Searched Nuxt modules', error: 'Module search unavailable' }
} as const

export function hasToolError(output: unknown): boolean {
  if (!output || typeof output !== 'object') return false
  const value = output as Record<string, unknown>
  return !!value.error || value.isError === true
}

/** Cards only receive explicitly picked, type-checked fields from tool outputs. */
function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function httpUrl(value: unknown): string | undefined {
  const s = str(value)
  if (!s) return undefined
  try {
    const url = new URL(s)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

function sitePath(value: unknown): string | undefined {
  const s = str(value)
  return s && s.startsWith('/') && !s.startsWith('//') && !s.includes('\\') ? s : undefined
}

function urlOrPath(value: unknown): string | undefined {
  return sitePath(value) ?? httpUrl(value)
}

function githubRepo(value: unknown): string | undefined {
  const s = str(value)
  return s && /^[\w.-]+\/[\w.-]+$/.test(s) ? s : undefined
}

function slugLike(value: unknown): string | undefined {
  const s = str(value)
  return s && /^[\w.@/-]+$/.test(s) && !s.includes('..') ? s : undefined
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

export function blogCardProps(output: unknown): BlogCardData | null {
  const o = asRecord(output)
  const title = str(o.title)
  const path = sitePath(o.path)
  if (!title || !path) return null
  const authors = Array.isArray(o.authors)
    ? o.authors.flatMap((a) => {
        const author = asRecord(a)
        const name = str(author.name)
        return name ? [{ name, avatar: urlOrPath(author.avatar) }] : []
      })
    : undefined
  return {
    title,
    path,
    description: str(o.description),
    date: str(o.date),
    image: urlOrPath(o.image),
    category: str(o.category),
    authors
  }
}

export function hostingCardProps(output: unknown): HostingCardData | null {
  const o = asRecord(output)
  const title = str(o.title)
  const path = sitePath(o.path)
  if (!title || !path) return null
  return {
    title,
    path,
    description: str(o.description),
    logoSrc: urlOrPath(o.logoSrc),
    logoIcon: str(o.logoIcon),
    category: str(o.category),
    nitroPreset: slugLike(o.nitroPreset),
    website: httpUrl(o.website)
  }
}

/** GitHub usernames: the card builds the avatar and profile links from it. */
function githubUsername(value: unknown): string | undefined {
  const s = str(value)
  return s && /^[a-z0-9-]{1,39}$/i.test(s) ? s : undefined
}

function count(value: unknown): number {
  const n = num(value)
  return n !== undefined && n > 0 ? Math.round(n) : 0
}

export function nuxterCardProps(output: unknown): NuxterCardData | null {
  const o = asRecord(output)
  const username = githubUsername(o.username)
  const path = sitePath(o.path)
  const rank = num(o.rank)
  if (!username || !path?.startsWith('/nuxters/') || !rank) return null
  return {
    username,
    name: str(o.name),
    periodPhrase: str(o.periodPhrase),
    rank: Math.round(rank),
    score: count(o.score),
    mergedPullRequests: count(o.mergedPullRequests),
    issues: count(o.issues),
    comments: count(o.comments),
    reactions: count(o.reactions),
    maintainedModules: count(o.maintainedModules),
    contributedModules: count(o.contributedModules),
    hackathons: Array.isArray(o.hackathons) ? o.hackathons.map(str).filter((h): h is string => !!h) : [],
    path
  }
}

export function playgroundCardProps(output: unknown): PlaygroundCardData | null {
  const o = asRecord(output)
  const url = httpUrl(o.url)
  const repo = str(o.repo)
  if (!url || !repo) return null
  return { url, repo, title: str(o.title), file: str(o.file), dir: str(o.dir) }
}

function templateCardProps(value: unknown): TemplateCardData | null {
  const o = asRecord(value)
  const name = str(o.name)
  const slug = slugLike(o.slug)
  if (!name || !slug) return null
  return {
    name,
    slug,
    description: str(o.description),
    repo: githubRepo(o.repo),
    demo: httpUrl(o.demo),
    badge: str(o.badge),
    purchase: httpUrl(o.purchase)
  }
}

export function getTemplates(output: unknown): TemplateCardData[] {
  const templates = asRecord(output).templates
  if (!Array.isArray(templates)) return []
  return templates.map(templateCardProps).filter((t): t is TemplateCardData => t !== null)
}

export function hasTemplatesOutput(output: unknown): boolean {
  return getTemplates(output).length > 0
}

export function getFeedbackOutput(output: unknown): FeedbackOutput | null {
  if (!output || typeof output !== 'object') return null
  const o = output as Record<string, unknown>
  if (typeof o.title === 'string' && typeof o.summary === 'string') {
    return { title: o.title, summary: o.summary }
  }
  return null
}

export function getPromptOutput(output: unknown): PromptCardData | null {
  const data = parsePromptCardOutput(output)
  if (!data) return null
  const o = output as Record<string, unknown>
  return {
    ...data,
    icon: typeof o.icon === 'string' ? o.icon : undefined
  }
}

/** Only settled results are rendered; preliminary output is still work in progress. */
export function hasToolOutput(part: ToolPart): boolean {
  return part.state === 'output-available' && !part.preliminary && part.output != null
}

export function getToolState(part: ToolPart, active = true) {
  if (part.state === 'output-denied' || (part.state === 'approval-responded' && !part.approval.approved)) return 'denied'
  if (part.state === 'output-error') return /cancelled|canceled/i.test(part.errorText) ? 'stopped' : 'error'
  if (part.state === 'output-available' && !part.preliminary) return hasToolError(part.output) ? 'error' : 'complete'
  if (part.state === 'approval-requested') return 'approval'
  return active ? 'running' : 'stopped'
}

export interface ToolReference {
  title: string
  url: string
  section?: string
  content?: string
}

export function getToolReferences(part: ToolPart): ToolReference[] {
  if (!hasToolOutput(part) || hasToolError(part.output)) return []
  const name = normalizeToolName(getToolName(part))
  const output = asRecord(part.output)
  const items = name === 'read_page'
    ? [output]
    : name === 'search_modules'
      ? output.modules
      : name === 'search_docs'
        ? output.results
        : name === 'web_search'
          ? (Array.isArray(part.output) ? part.output : Array.isArray(output.sources) && output.sources.length ? output.sources : output.results)
          : []
  if (!Array.isArray(items)) return []

  return items.flatMap((item): ToolReference[] => {
    const value = asRecord(item)
    const slug = name === 'search_modules' ? slugLike(value.slug) : undefined
    const url = urlOrPath(value.url ?? value.path) ?? (slug ? `/modules/${slug}` : undefined)
    if (!url) return []
    return [{
      title: str(value.title) ?? str(value.npm) ?? str(value.name) ?? url,
      url,
      section: str(value.section),
      content: str(value.content) ?? str(value.description)
    }]
  })
}

function hasRichToolSuccess(part: ToolPart, toolName: RichToolName): boolean {
  if (!hasToolOutput(part)) return false

  switch (toolName) {
    case 'show_module':
      return isValidModuleCardData(part.output)
    case 'show_template':
      return !!part.output && !hasToolError(part.output) && hasTemplatesOutput(part.output)
    case 'show_blog_post':
      return !!blogCardProps(part.output)
    case 'show_hosting':
      return !!hostingCardProps(part.output)
    case 'show_nuxter':
      return !!nuxterCardProps(part.output)
    case 'open_playground':
      return !!playgroundCardProps(part.output)
    case 'report_issue':
      return !!getFeedbackOutput(part.output)
    case 'show_prompt':
      return !!getPromptOutput(part.output)
  }
}

export function getToolPresentation(part: ToolPart, active: boolean) {
  const name = normalizeToolName(getToolName(part))
  const rich = Object.hasOwn(RICH_TOOL_HEADERS, name) ? RICH_TOOL_HEADERS[name as RichToolName] : undefined
  const config = rich ?? (Object.hasOwn(LOOKUP_HEADERS, name) ? LOOKUP_HEADERS[name as keyof typeof LOOKUP_HEADERS] : undefined)
  let state = getToolState(part, active)
  if (state === 'complete' && rich && !hasRichToolSuccess(part, name as RichToolName)) state = 'error'

  const sourceCount = name === 'web_search' && state === 'complete' ? getSources(part).length : 0
  let text = config
    ? (state === 'complete' ? config.success : config.loading)
    : name === 'web_search'
      ? (state === 'complete' ? 'Searched the web' : 'Searching the web')
      : name === 'connection_search'
        ? (state === 'complete' ? 'Found available tools' : 'Finding available tools')
        : getToolText(part)

  if (state === 'complete' && (name === 'search_docs' || name === 'search_modules')) {
    const matches = asRecord(part.output)[name === 'search_docs' ? 'results' : 'modules']
    const label = name === 'search_docs' ? 'documentation section' : 'module'
    if (Array.isArray(matches)) text = matches.length ? `Found ${matches.length} ${label}${matches.length === 1 ? '' : 's'}` : `No matching ${label}s`
  }

  if (name === 'read_page' && (state === 'running' || state === 'complete')) {
    const path = asRecord(part.input).path
    if (typeof path === 'string') {
      const slug = path.split(/[?#]/)[0]?.split('/').filter(Boolean).at(-1)?.replace(/[-_]/g, ' ')
      if (slug) text = `${state === 'complete' ? 'Read' : 'Reading'} ${slug === 'upgrade' ? 'the upgrade guide' : slug}`
    }
  }

  if (state === 'stopped') text = `Stopped ${text.charAt(0).toLowerCase()}${text.slice(1)}`
  else if (state === 'denied') text = `Not approved: ${text}`
  else if (state === 'approval') text = 'Waiting for approval'
  else if (state === 'error') text = config?.error ?? (name === 'web_search' ? 'Web search failed' : name === 'connection_search' ? 'Could not find available tools' : `Could not ${name.replace(/[-_]+/g, ' ')}`)

  return {
    text,
    state,
    streaming: state === 'running',
    suffix: part.state === 'input-streaming'
      ? undefined
      : name === 'connection_search'
        ? getConnectionSearchSuffix(part)
        : name === 'web_search'
          ? [getSearchQuery(part), sourceCount ? `${sourceCount} sources` : undefined].filter(Boolean).join(' · ') || undefined
          : getToolSuffix(part)
  }
}

export function showModuleCard(part: ToolPart): boolean {
  return showCardOutput(part) && isValidModuleCardData(part.output)
}

export function showTemplateCards(part: ToolPart): boolean {
  return hasToolOutput(part) && !!part.output && !hasToolError(part.output) && hasTemplatesOutput(part.output)
}

export function showCardOutput(part: ToolPart): boolean {
  return hasToolOutput(part) && !!part.output && !hasToolError(part.output)
}

export function showFeedbackCard(part: ToolPart): boolean {
  return showCardOutput(part) && !!getFeedbackOutput(part.output)
}

export function showPromptCard(part: ToolPart): boolean {
  return showCardOutput(part) && !!getPromptOutput(part.output)
}

export function isModuleListTool(part: ToolPart): boolean {
  const toolName = normalizeToolName(getToolName(part))
  return (toolName === 'get-module' || toolName === 'list-modules') && getModuleCards(part).length > 0
}

export function isValidModuleCardData(output: unknown): output is ModuleCardData {
  if (!output || typeof output !== 'object') return false
  const o = output as Record<string, unknown>
  if ('error' in o && o.error) return false
  const name = o.name
  return typeof name === 'string' && name.trim().length > 0
}

/** Maps API/tool `name` to `slug` so we never pass a `name` prop into ModuleCard (conflicts with Vue Router / NuxtLink). */
export function moduleCardProps(data: ModuleCardData): Omit<ModuleCardData, 'name'> & { slug: string } {
  return {
    slug: slugLike(data.name) ?? 'module',
    npm: str(data.npm),
    description: str(data.description),
    icon: str(data.icon),
    category: str(data.category),
    repo: githubRepo(data.repo),
    website: httpUrl(data.website),
    downloads: num(data.downloads),
    stars: num(data.stars)
  }
}

export function getToolText(part: ToolPart) {
  const done = part.state === 'output-available' && !part.preliminary
  const { verb, label } = parseToolName(getToolName(part))

  if (verb) return `${done ? verb[1] : verb[0]} ${label}`

  return `${done ? 'Searched' : 'Searching'} ${label}`
}

export function getToolSuffix(part: ToolPart): string | undefined {
  const input = (part.input || {}) as Record<string, unknown>

  for (const key of SUFFIX_KEYS) {
    const value = input[key]
    if (typeof value === 'string' && value.trim()) return value
  }

  return undefined
}

export function getToolIcon(part: ToolPart): string {
  const name = normalizeToolName(getToolName(part)).toLowerCase()

  if (/^add[-_]app[-_]module/.test(name)) return 'i-lucide-package-plus'
  if (/^edit[-_]app/.test(name)) return 'i-lucide-file-pen'
  if (/^(?:list|read)[-_]app/.test(name)) return 'i-lucide-file-code'
  if (/^check[-_]app/.test(name)) return 'i-lucide-scan-eye'
  if (/icon/.test(name)) return 'i-lucide-smile'
  if (/component/.test(name)) return 'i-lucide-box'
  if (/composable/.test(name)) return 'i-lucide-square-function'
  if (/template/.test(name)) return 'i-lucide-layout-template'
  if (/example|snippet/.test(name)) return 'i-lucide-code'
  if (/module|package/.test(name)) return 'i-lucide-box'
  if (/blog|post|news/.test(name)) return 'i-lucide-newspaper'
  if (/changelog|release/.test(name)) return 'i-lucide-history'
  if (/deploy|hosting|provider/.test(name)) return 'i-lucide-cloud'
  if (/getting.?started|guide/.test(name)) return 'i-lucide-rocket'
  if (/nuxter/.test(name)) return 'i-lucide-award'
  if (/issue|github/.test(name)) return 'i-simple-icons-github'
  if (/page|doc/.test(name)) {
    const isList = /^(?:list|search|find|query)[-_]/.test(name)
    return isList ? 'i-lucide-book-open' : 'i-lucide-file-text'
  }

  return 'i-lucide-search'
}

export function getModuleCards(part: ToolPart): ModuleCardData[] {
  if (!showCardOutput(part)) return []

  const toolName = normalizeToolName(getToolName(part))
  const output = part.output as Record<string, unknown>

  if (toolName === 'get-module') {
    const content = (output.content ?? output) as Array<{ text?: string }> | Record<string, unknown>
    let data: Record<string, unknown> | undefined
    if (Array.isArray(content)) {
      const text = content.find(c => c.text)?.text
      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          // ignore malformed JSON
        }
      }
    } else {
      data = content
    }
    if (data?.name) {
      return [{
        name: data.name as string,
        npm: data.npm as string | undefined,
        description: data.description as string | undefined,
        icon: data.icon as string | undefined,
        category: data.category as string | undefined,
        repo: data.repo as string | undefined,
        website: data.website as string | undefined,
        downloads: (data.stats as Record<string, number> | undefined)?.downloads,
        stars: (data.stats as Record<string, number> | undefined)?.stars
      }]
    }
  }

  if (toolName === 'list-modules') {
    const content = (output.content ?? output) as Array<{ text?: string }> | unknown
    let payload: Record<string, unknown> | unknown[] | undefined
    if (Array.isArray(content)) {
      const text = content.find((c: { text?: string }) => c.text)?.text
      if (text) {
        try {
          payload = JSON.parse(text)
        } catch {
          // ignore malformed JSON
        }
      }
    } else if (content && typeof content === 'object') {
      // Already-decoded `{ modules: [...] }`, as `get-module` above accepts.
      payload = content as Record<string, unknown>
    }
    const items = Array.isArray(payload)
      ? payload as Record<string, unknown>[]
      : (payload as { modules?: Record<string, unknown>[] } | undefined)?.modules

    if (Array.isArray(items)) {
      return items.filter(m => m.name).slice(0, 5).map(m => ({
        name: m.name as string,
        npm: m.npm as string | undefined,
        description: m.description as string | undefined,
        icon: m.icon as string | undefined,
        category: m.category as string | undefined,
        repo: m.repo as string | undefined,
        website: m.website as string | undefined,
        downloads: (m.downloads as number | undefined) ?? (m.stats as Record<string, number> | undefined)?.downloads,
        stars: (m.stars as number | undefined) ?? (m.stats as Record<string, number> | undefined)?.stars
      }))
    }
  }

  return []
}
