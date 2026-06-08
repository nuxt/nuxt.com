import type { ToolUIPart, DynamicToolUIPart } from 'ai'
import { getToolName } from 'ai'
import { isToolStreaming } from '@nuxt/ui/utils/ai'

export type ToolPart = ToolUIPart | DynamicToolUIPart
type ToolState = ToolPart['state']

export type FeedbackOutput = { title: string, summary: string }

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

function hasRichToolSuccess(part: ToolPart, toolName: RichToolName): boolean {
  switch (toolName) {
    case 'show_module':
      return part.state === 'output-available' && isValidModuleCardData(part.output)
    case 'show_template':
      return part.state === 'output-available' && !!part.output && !hasToolError(part.output) && hasTemplatesOutput(part.output)
    case 'show_blog_post':
    case 'show_hosting':
      return part.state === 'output-available' && !!part.output && !hasToolError(part.output)
    case 'open_playground':
    case 'report_issue':
      return true
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
  return part.state === 'output-available' && isValidModuleCardData(part.output)
}

export function showTemplateCards(part: ToolPart): boolean {
  return part.state === 'output-available' && !!part.output && !hasToolError(part.output) && hasTemplatesOutput(part.output)
}

export function showCardOutput(part: ToolPart): boolean {
  return part.state === 'output-available' && !!part.output && !hasToolError(part.output)
}

export function showPlaygroundCard(part: ToolPart): boolean {
  return part.state === 'output-available' && !!part.output
}

export function showFeedbackCard(part: ToolPart): boolean {
  return part.state === 'output-available' && !!getFeedbackOutput(part.output)
}

export function isModuleListTool(part: ToolPart): boolean {
  const toolName = getToolName(part)
  return (toolName === 'get-module' || toolName === 'list-modules') && getModuleCards(part).length > 0
}

export function getMcpToolHeader(part: ToolPart) {
  return {
    text: getToolText(part),
    suffix: getToolSuffix(part),
    icon: getToolIcon(part),
    streaming: isToolStreaming(part)
  }
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

function getToolMessage(state: ToolState, toolName: string) {
  const searchVerb = state === 'output-available' ? 'Searched' : 'Searching'
  const readVerb = state === 'output-available' ? 'Read' : 'Reading'
  const foundVerb = state === 'output-available' ? 'Found' : 'Finding'

  return {
    'list-documentation-pages': `${searchVerb} documentation`,
    'get-documentation-page': `${readVerb} documentation`,
    'get-getting-started-guide': `${readVerb} getting started`,
    'list-blog-posts': `${searchVerb} blog posts`,
    'get-blog-post': `${readVerb} blog post`,
    'list-deploy-providers': `${searchVerb} deploy providers`,
    'get-deploy-provider': `${readVerb} deploy guide`,
    'get-changelog': `${searchVerb} changelog`,
    'list-modules': `${searchVerb} modules`,
    'get-module': `${readVerb} module`,
    'show_template': `${foundVerb} templates`,
    'show_blog_post': `${foundVerb} blog post`,
    'show_hosting': `${foundVerb} hosting provider`,
    'open_playground': `${state === 'output-available' ? 'Generated' : 'Generating'} playground`,
    'search_github_issues': `${searchVerb} issues`
  }[toolName] || `${searchVerb} ${toolName}`
}

export function getToolText(part: ToolPart) {
  return getToolMessage(part.state, getToolName(part))
}

export function getToolSuffix(part: ToolPart): string | undefined {
  const toolName = getToolName(part)
  const toolInput = (part.input || {}) as Record<string, string | undefined>

  return {
    'list-documentation-pages': toolInput.search,
    'get-documentation-page': toolInput.path,
    'get-blog-post': toolInput.path,
    'get-deploy-provider': toolInput.path,
    'get-changelog': toolInput.repo,
    'list-modules': toolInput.search,
    'get-module': toolInput.slug,
    'search_github_issues': toolInput.query
  }[toolName] || undefined
}

export function getToolIcon(part: ToolPart): string {
  const toolName = getToolName(part)

  return {
    'list-documentation-pages': 'i-lucide-book-open',
    'get-documentation-page': 'i-lucide-file-text',
    'get-getting-started-guide': 'i-lucide-rocket',
    'list-blog-posts': 'i-lucide-newspaper',
    'get-blog-post': 'i-lucide-newspaper',
    'list-deploy-providers': 'i-lucide-cloud',
    'get-deploy-provider': 'i-lucide-cloud',
    'get-changelog': 'i-lucide-history',
    'list-modules': 'i-lucide-box',
    'get-module': 'i-lucide-box',
    'show_template': 'i-lucide-layout-template',
    'show_blog_post': 'i-lucide-newspaper',
    'show_hosting': 'i-lucide-server',
    'open_playground': 'i-simple-icons-stackblitz',
    'search_github_issues': 'i-lucide-github'
  }[toolName] || 'i-lucide-search'
}

export function getModuleCards(part: ToolPart): ModuleCardData[] {
  if (part.state !== 'output-available' || !part.output) return []

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

const TEXT_TOOLS = new Set([
  'list-documentation-pages',
  'get-documentation-page',
  'get-getting-started-guide',
  'get-blog-post',
  'get-deploy-provider',
  'get-changelog'
])

export function getToolOutput(part: ToolPart): string | undefined {
  if (part.state !== 'output-available' || !part.output) return undefined

  const output = part.output as Record<string, unknown>

  if (TEXT_TOOLS.has(getToolName(part))) {
    const content = (output.content ?? output) as Array<{ text?: string }> | string
    const text = typeof content === 'string' ? content : content?.map(c => c.text).filter(Boolean).join('\n') || ''
    return text.length > 500 ? `${text.slice(0, 500)}…` : text || undefined
  }

  const json = JSON.stringify(output, null, 2)
  return json.length > 500 ? `${json.slice(0, 500)}…` : json
}
