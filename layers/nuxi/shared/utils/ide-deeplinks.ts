export const MAX_PROMPT_LENGTH = 5000

/** Max prompt length for show_prompt cards — must fit in browser deeplink URLs. */
export const PROMPT_CARD_MAX_LENGTH = 800

/** Claude `q` in deeplinks. */
export const CLAUDE_DEEPLINK_MAX_Q = 1500

/** Chrome truncates custom-scheme URLs around ~2048 chars — stay well under. */
export const CLAUDE_BROWSER_MAX_URL = 1800

export const REPO_PATTERN = /^[\w-]+\/[\w.-]+$/

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

export function normalizeRepo(repo?: string): string | undefined {
  const trimmed = repo?.trim()
  if (!trimmed || !REPO_PATTERN.test(trimmed)) return undefined
  return trimmed
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

/** Cursor deeplink — aligned with Nuxt UI ProsePrompt. */
export function buildCursorPromptUrl(prompt: string): string {
  const text = truncatePrompt(prompt)
  return `cursor://anysphere.cursor-deeplink/prompt?text=${encodeURIComponent(text)}`
}

/** Browser-safe Cursor deeplink — fits under Chrome custom-scheme URL limit. */
export function buildCursorBrowserUrl(prompt: string): {
  url: string
  needsClipboardFallback: boolean
} {
  const normalized = truncatePrompt(prompt, PROMPT_CARD_MAX_LENGTH)
  const prefix = 'cursor://anysphere.cursor-deeplink/prompt?text='
  const { q, truncated } = fitEncodedQuery(normalized, prefix, CLAUDE_BROWSER_MAX_URL)
  return {
    url: `${prefix}${encodeURIComponent(q)}`,
    needsClipboardFallback: truncated || q !== normalized
  }
}

/** Claude Code terminal deeplink — https://code.claude.com/docs/en/deep-links */
export function buildClaudeCodeUrl(prompt: string, repo?: string): string {
  const q = truncatePrompt(prompt, CLAUDE_DEEPLINK_MAX_Q)
  const parts = [`q=${encodeURIComponent(q)}`]
  const normalizedRepo = normalizeRepo(repo)
  if (normalizedRepo) parts.push(`repo=${encodeURIComponent(normalizedRepo)}`)
  return `claude-cli://open?${parts.join('&')}`
}

/** Browser Claude deeplink — prefills `q` when the URL fits, else signals clipboard fallback. */
export function buildClaudeCodeBrowserUrl(prompt: string, repo?: string): {
  url: string
  needsClipboardFallback: boolean
} {
  const normalizedRepo = normalizeRepo(repo)
  const baseParams: string[] = []
  if (normalizedRepo) baseParams.push(`repo=${encodeURIComponent(normalizedRepo)}`)

  const prefix = `claude-cli://open?${baseParams.length ? `${baseParams.join('&')}&` : ''}q=`
  const { q, truncated } = fitEncodedQuery(
    truncatePrompt(prompt, PROMPT_CARD_MAX_LENGTH),
    prefix,
    CLAUDE_BROWSER_MAX_URL
  )

  if (truncated) {
    const url = baseParams.length
      ? `claude-cli://open?${baseParams.join('&')}`
      : 'claude-cli://open'
    return { url, needsClipboardFallback: true }
  }

  baseParams.push(`q=${encodeURIComponent(q)}`)
  const url = `claude-cli://open?${baseParams.join('&')}`

  if (url.length > CLAUDE_BROWSER_MAX_URL) {
    const fallbackUrl = normalizedRepo
      ? `claude-cli://open?repo=${encodeURIComponent(normalizedRepo)}`
      : 'claude-cli://open'
    return { url: fallbackUrl, needsClipboardFallback: true }
  }

  return {
    url,
    needsClipboardFallback: false
  }
}

export function buildIdeDeeplinks(prompt: string, repo?: string) {
  const cursor = buildCursorBrowserUrl(prompt)
  const claude = buildClaudeCodeBrowserUrl(prompt, repo)
  return {
    cursor: cursor.url,
    claude: claude.url,
    claudeNeedsClipboardFallback: claude.needsClipboardFallback
  }
}

export function parsePromptCardOutput(output: unknown): {
  description: string
  prompt: string
  repo?: string
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
    repo: typeof o.repo === 'string' ? o.repo : undefined,
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
