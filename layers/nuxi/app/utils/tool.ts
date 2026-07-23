import type { DynamicToolUIPart, ToolUIPart, UITools } from 'ai'

export interface Source {
  url: string
  title?: string
}

interface SearchInput {
  query?: string
  // Eve builtin web_search
  objective?: string
  search_queries?: string[]
}

interface SearchOutput {
  sources?: { url: string, type?: string }[]
  // Eve builtin web_search
  results?: { url?: string, title?: string }[]
}

type ToolPart = ToolUIPart<UITools> | DynamicToolUIPart

export function getSearchQuery(part: ToolPart): string | undefined {
  const input = part.input as SearchInput | undefined
  return input?.query ?? input?.search_queries?.[0] ?? input?.objective
}

export function getSources(part: ToolPart): Source[] {
  const output = part.output
  if (!output) return []

  if (Array.isArray(output)) {
    return output.filter((s: Source) => s.url).map((s: Source) => ({ url: s.url, title: s.title }))
  }

  const typed = output as SearchOutput
  const entries = typed.sources ?? typed.results
  if (entries) {
    return entries
      .filter((s): s is { url: string, title?: string } => typeof s.url === 'string' && s.url.length > 0)
      .map(s => ({ url: s.url, title: 'title' in s ? s.title : undefined }))
  }

  return []
}

export function sourceToInlineMdc(url: string): string {
  const domain = getDomain(url)
  const favicon = getFaviconUrl(url)
  const safeUrl = url.replace(/"/g, '&quot;')
  const safeFavicon = favicon.replace(/"/g, '&quot;')

  return ` :source-link{url="${safeUrl}" favicon="${safeFavicon}" label="${domain}"}`
}
