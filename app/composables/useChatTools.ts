import type { ToolUIPart, DynamicToolUIPart } from 'ai'
import { getToolName } from 'ai'

export type ToolPart = ToolUIPart | DynamicToolUIPart
type ToolState = ToolPart['state']

export interface ModuleCardData {
  name: string
  npm?: string
  description?: string
  icon?: string
  category?: string
  repo?: string
  website?: string
  downloads?: number
  stars?: number
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

export interface TemplateCardData {
  name: string
  slug: string
  description?: string
  repo?: string
  demo?: string
  badge?: string
  purchase?: string
}

export interface BlogCardData {
  title: string
  description?: string
  path: string
  date?: string
  image?: string
  category?: string
  authors?: Array<{ name: string, avatar?: string }>
}

export interface HostingCardData {
  title: string
  description?: string
  path: string
  logoSrc?: string
  logoIcon?: string
  category?: string
  nitroPreset?: string
  website?: string
}

export interface PlaygroundCardData {
  url: string
  repo: string
  title?: string
  file?: string
  dir?: string
}

function getToolMessage(state: ToolState, toolName: string, toolInput: Record<string, string | undefined>) {
  const searchVerb = state === 'output-available' ? 'Searched' : 'Searching'
  const readVerb = state === 'output-available' ? 'Read' : 'Reading'
  const foundVerb = state === 'output-available' ? 'Found' : 'Finding'

  return {
    'list-documentation-pages': `${searchVerb} documentation${toolInput.search ? ` · ${toolInput.search}` : ''}`,
    'get-documentation-page': `${readVerb} ${toolInput.path || '...'}`,
    'get-getting-started-guide': `${readVerb} getting started`,
    'get-blog-post': `${readVerb} ${toolInput.path || 'blog post'}`,
    'get-deploy-provider': `${readVerb} ${toolInput.path || 'deploy guide'}`,
    'get-changelog': `${searchVerb} changelog${toolInput.repo ? ` · ${toolInput.repo}` : ''}`,
    'list-modules': `${searchVerb} modules${toolInput.search ? ` · ${toolInput.search}` : ''}`,
    'get-module': `${readVerb} module ${toolInput.slug || '...'}`,
    'show_template': `${foundVerb} templates`,
    'show_blog_post': `${foundVerb} blog post`,
    'show_hosting': `${foundVerb} hosting provider`,
    'open_playground': `${state === 'output-available' ? 'Generated' : 'Generating'} playground`
  }[toolName] || `${searchVerb} ${toolName}`
}

export function getToolText(part: ToolPart) {
  return getToolMessage(part.state, getToolName(part), (part.input || {}) as Record<string, string | undefined>)
}

export function getToolIcon(part: ToolPart): string {
  const toolName = getToolName(part)

  return {
    'list-documentation-pages': 'i-lucide-book-open',
    'get-documentation-page': 'i-lucide-file-text',
    'get-getting-started-guide': 'i-lucide-rocket',
    'get-blog-post': 'i-lucide-newspaper',
    'get-deploy-provider': 'i-lucide-cloud',
    'get-changelog': 'i-lucide-history',
    'list-modules': 'i-lucide-box',
    'get-module': 'i-lucide-box',
    'show_template': 'i-lucide-layout-template',
    'show_blog_post': 'i-lucide-newspaper',
    'show_hosting': 'i-lucide-server',
    'open_playground': 'i-simple-icons-stackblitz'
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
