export const MAX_PROMPT_LENGTH = 5000

/** Max prompt length for show_prompt cards — must fit in browser deeplink URLs. */
export const PROMPT_CARD_MAX_LENGTH = 800

/** Chrome truncates custom-scheme URLs around ~2048 chars — stay well under. */
export const CLAUDE_BROWSER_MAX_URL = 1800

/** Slice on Unicode code-point boundaries so surrogate pairs stay valid for encodeURIComponent. */
function sliceCodePoints(text: string, maxLength: number): string {
  if (maxLength <= 0) return ''
  const units = [...text]
  if (units.length <= maxLength) return text
  return units.slice(0, maxLength).join('')
}

export function truncatePrompt(prompt: string, max = MAX_PROMPT_LENGTH): string {
  const trimmed = prompt.trim()
  if ([...trimmed].length <= max) return trimmed
  return `${sliceCodePoints(trimmed, max - 1)}…`
}

function fitEncodedQuery(prompt: string, prefix: string, maxUrlLength: number): { q: string, truncated: boolean } {
  const trimmed = truncatePrompt(prompt)
  const budget = maxUrlLength - prefix.length

  if (budget <= 0) {
    return { q: '', truncated: true }
  }

  if (encodeURIComponent(trimmed).length <= budget) {
    return { q: trimmed, truncated: false }
  }

  let q = trimmed
  while ([...q].length > 1 && encodeURIComponent(`${q}…`).length > budget) {
    q = sliceCodePoints(q, [...q].length - 20)
  }

  if (q.length >= trimmed.length) {
    return { q: trimmed, truncated: false }
  }

  return { q: `${q.trimEnd()}…`, truncated: true }
}

/** Browser-safe custom-scheme deeplink — fits under Chrome's URL length limit. */
function buildBrowserDeeplink(prompt: string, prefix: string): {
  url: string
  needsClipboardFallback: boolean
} {
  const normalized = truncatePrompt(prompt, PROMPT_CARD_MAX_LENGTH)
  const { q, truncated } = fitEncodedQuery(normalized, prefix, CLAUDE_BROWSER_MAX_URL)
  return {
    url: `${prefix}${encodeURIComponent(q)}`,
    needsClipboardFallback: truncated || q !== normalized
  }
}

/** Cursor deeplink — aligned with Nuxt UI ProsePrompt. */
export function buildCursorPromptUrl(prompt: string): string {
  const text = truncatePrompt(prompt)
  return `cursor://anysphere.cursor-deeplink/prompt?text=${encodeURIComponent(text)}`
}

/** Browser-safe Cursor deeplink — fits under Chrome custom-scheme URL limit. */
export function buildCursorBrowserUrl(prompt: string) {
  return buildBrowserDeeplink(prompt, 'cursor://anysphere.cursor-deeplink/prompt?text=')
}

/** Claude Desktop deeplink — aligned with Nuxt UI ProsePrompt. https://support.claude.com/en/articles/14729294 */
export function buildClaudeCodeUrl(prompt: string): string {
  const text = truncatePrompt(prompt)
  return `claude://code/new?q=${encodeURIComponent(text)}`
}

/** Browser-safe Claude deeplink — fits under Chrome custom-scheme URL limit. */
export function buildClaudeCodeBrowserUrl(prompt: string) {
  return buildBrowserDeeplink(prompt, 'claude://code/new?q=')
}

/** VS Code + GitHub Copilot Chat deeplink. */
export function buildVSCodeUrl(prompt: string): string {
  const text = truncatePrompt(prompt)
  return `vscode://GitHub.Copilot-Chat/chat?agent=agent&prompt=${encodeURIComponent(text)}`
}

/** Browser-safe VS Code deeplink — fits under Chrome custom-scheme URL limit. */
export function buildVSCodeBrowserUrl(prompt: string) {
  return buildBrowserDeeplink(prompt, 'vscode://GitHub.Copilot-Chat/chat?agent=agent&prompt=')
}

export function buildIdeDeeplinks(prompt: string) {
  const cursor = buildCursorBrowserUrl(prompt)
  const claude = buildClaudeCodeBrowserUrl(prompt)
  return {
    cursor: cursor.url,
    claude: claude.url,
    claudeNeedsClipboardFallback: claude.needsClipboardFallback
  }
}

export function parsePromptCardOutput(output: unknown): {
  description: string
  prompt: string
  deeplinks: { cursor: string, claude: string }
} | null {
  if (!output || typeof output !== 'object') return null
  const o = output as Record<string, unknown>
  if ('error' in o && o.error) return null
  if (typeof o.description !== 'string' || typeof o.prompt !== 'string') return null
  const deeplinks = o.deeplinks
  if (!deeplinks || typeof deeplinks !== 'object') return null
  const links = deeplinks as Record<string, unknown>
  if (typeof links.cursor !== 'string' || typeof links.claude !== 'string') return null
  return {
    description: o.description,
    prompt: o.prompt,
    deeplinks: {
      cursor: links.cursor,
      claude: links.claude,
      ...(typeof o.claudeNeedsClipboardFallback === 'boolean'
        ? { claudeNeedsClipboardFallback: o.claudeNeedsClipboardFallback }
        : typeof links.claudeNeedsClipboardFallback === 'boolean'
          ? { claudeNeedsClipboardFallback: links.claudeNeedsClipboardFallback }
          : {})
    }
  }
}
