import type { ToolUIPart, DynamicToolUIPart } from 'ai'
import { getToolName } from 'ai'
import { isToolStreaming } from '@nuxt/ui/utils/ai'

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
  create: ['Creating', 'Created']
}

const SUFFIX_KEYS = [
  'search',
  'query',
  'q',
  'term',
  'path',
  'slug',
  'templateName',
  'componentName',
  'composableName',
  'name',
  'repo',
  'section',
  'id'
]

function parseToolName(toolName: string): { verb?: [string, string], label: string } {
  const parts = toolName.split(/[-_\s]+/).filter(Boolean)
  const head = parts[0]?.toLowerCase()

  if (head && VERBS[head] && parts.length > 1) {
    return { verb: VERBS[head], label: parts.slice(1).join(' ') }
  }

  return { label: parts.join(' ') || toolName }
}

type RichToolName = 'show_module' | 'show_template' | 'show_blog_post' | 'show_hosting' | 'open_playground' | 'report_issue'

const RICH_TOOL_HEADERS = {
  show_module: { loading: 'Loading module...', success: 'Found module', error: 'Module not found', icon: 'i-lucide-box' },
  show_template: { loading: 'Loading templates...', success: 'Found templates', error: 'Templates not found', icon: 'i-lucide-layout-template' },
  show_blog_post: { loading: 'Finding blog post...', success: 'Found blog post', error: 'Blog post not found', icon: 'i-lucide-newspaper' },
  show_hosting: { loading: 'Loading provider...', success: 'Found provider', error: 'Provider not found', icon: 'i-lucide-server' },
  open_playground: { loading: 'Generating playground...', success: 'Playground ready', error: 'Playground ready', icon: 'i-simple-icons-stackblitz' },
  report_issue: { loading: 'Preparing feedback form...', success: 'Help us improve', error: 'Help us improve', icon: 'i-lucide-message-circle-warning' }
} as const satisfies Record<RichToolName, { loading: string, success: string, error: string, icon: string }>

export function hasToolError(output: unknown): boolean {
  if (!output || typeof output !== 'object') return false
  return !!(output as Record<string, unknown>).error
}

export function getTemplates(output: unknown): TemplateCardData[] {
  if (!output || typeof output !== 'object') return []
  const o = output as Record<string, unknown>
  if (Array.isArray(o.templates)) return o.templates as TemplateCardData[]
  return []
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

/** Tool output is ready to render (terminal state or output already present). */
export function hasToolOutput(part: ToolPart): boolean {
  if (part.state === 'output-error' || part.state === 'output-denied') return false
  if (part.state === 'output-available') return part.output != null
  return part.output != null
}

function hasRichToolSuccess(part: ToolPart, toolName: RichToolName): boolean {
  if (!hasToolOutput(part)) return false

  switch (toolName) {
    case 'show_module':
      return isValidModuleCardData(part.output)
    case 'show_template':
      return !!part.output && !hasToolError(part.output) && hasTemplatesOutput(part.output)
    case 'show_blog_post':
    case 'show_hosting':
      return !!part.output && !hasToolError(part.output)
    case 'open_playground':
      return !!part.output
    case 'report_issue':
      return !!getFeedbackOutput(part.output)
  }
}

export function getRichToolHeader(part: ToolPart, toolName: RichToolName) {
  const config = RICH_TOOL_HEADERS[toolName]
  const streaming = isToolStreaming(part)

  return {
    text: streaming ? config.loading : (hasRichToolSuccess(part, toolName) ? config.success : config.error),
    icon: config.icon,
    streaming
  }
}

export function showModuleCard(part: ToolPart): boolean {
  return hasToolOutput(part) && isValidModuleCardData(part.output)
}

export function showTemplateCards(part: ToolPart): boolean {
  return hasToolOutput(part) && !!part.output && !hasToolError(part.output) && hasTemplatesOutput(part.output)
}

export function showCardOutput(part: ToolPart): boolean {
  return hasToolOutput(part) && !!part.output && !hasToolError(part.output)
}

export function showPlaygroundCard(part: ToolPart): boolean {
  return hasToolOutput(part) && !!part.output
}

export function showFeedbackCard(part: ToolPart): boolean {
  return hasToolOutput(part) && !!getFeedbackOutput(part.output)
}

export function isModuleListTool(part: ToolPart): boolean {
  const toolName = getToolName(part)
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
  const { name, ...rest } = data
  return { ...rest, slug: name }
}

export function getToolText(part: ToolPart) {
  const done = part.state === 'output-available'
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
  const name = getToolName(part).toLowerCase()

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
  if (/issue|github/.test(name)) return 'i-simple-icons-github'
  if (/page|doc/.test(name)) {
    const isList = /^(?:list|search|find|query)[-_]/.test(name)
    return isList ? 'i-lucide-book-open' : 'i-lucide-file-text'
  }

  return 'i-lucide-search'
}

export function getModuleCards(part: ToolPart): ModuleCardData[] {
  if (!hasToolOutput(part) || !part.output) return []

  const toolName = getToolName(part)
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
