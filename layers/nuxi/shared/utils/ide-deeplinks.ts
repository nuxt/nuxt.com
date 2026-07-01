export const MAX_PROMPT_LENGTH = 5000

/** Max prompt length for show_prompt cards — must fit in browser deeplink URLs. */
export const PROMPT_CARD_MAX_LENGTH = 800

/** Claude `q` in deeplinks for Slack / shell `open`. */
export const CLAUDE_DEEPLINK_MAX_Q = 1500

/** Chrome truncates custom-scheme URLs around ~2048 chars — stay well under. */
export const CLAUDE_BROWSER_MAX_URL = 1800

export const REPO_PATTERN = /^[\w-]+\/[\w.-]+$/

export function truncatePrompt(prompt: string, max = MAX_PROMPT_LENGTH): string {
  const trimmed = prompt.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}

export function normalizeRepo(repo?: string): string | undefined {
  const trimmed = repo?.trim()
  if (!trimmed || !REPO_PATTERN.test(trimmed)) return undefined
  return trimmed
}

export function isClaudeDeeplinkTruncated(prompt: string): boolean {
  return prompt.trim().length > CLAUDE_DEEPLINK_MAX_Q
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
  while (q.length > 1 && encodeURIComponent(`${q}…`).length > budget) {
    q = q.slice(0, -20)
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
export function buildCursorBrowserUrl(prompt: string): string {
  const prefix = 'cursor://anysphere.cursor-deeplink/prompt?text='
  const { q } = fitEncodedQuery(truncatePrompt(prompt, PROMPT_CARD_MAX_LENGTH), prefix, CLAUDE_BROWSER_MAX_URL)
  return `${prefix}${encodeURIComponent(q)}`
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
  return {
    cursor: buildCursorPromptUrl(prompt),
    claude: buildClaudeCodeUrl(prompt, repo)
  }
}

/** Site origin for HTTPS redirect wrappers (Slack requires http(s) button URLs). */
function vercelDeploymentOrigin(): string | undefined {
  const url = process.env.VERCEL_URL?.trim()
  if (!url) return undefined
  return (url.startsWith('http') ? url : `https://${url}`).replace(/\/$/, '')
}

/** Resolved public web origin — preview deployments use VERCEL_URL, not production NUXT_PUBLIC_SITE_URL. */
export function resolveSiteOrigin(): string {
  const vercelOrigin = vercelDeploymentOrigin()
  const vercelEnv = process.env.VERCEL_ENV

  if ((vercelEnv === 'preview' || vercelEnv === 'development') && vercelOrigin) {
    return vercelOrigin
  }

  const configured = process.env.NUXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '')
    || process.env.NUXT_SITE_URL?.trim().replace(/\/$/, '')
  if (configured) return configured

  if (vercelOrigin) return vercelOrigin

  return 'http://localhost:3000'
}

export function getIdeRedirectOrigin(): string {
  return resolveSiteOrigin()
}

export function isAllowedIdeDeeplink(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol === 'cursor:') {
    return parsed.hostname === 'anysphere.cursor-deeplink' && parsed.pathname === '/prompt'
  }
  if (parsed.protocol === 'claude-cli:') {
    return parsed.hostname === 'open'
  }
  return false
}

/** Wrap a custom-scheme IDE URL in an https redirect for Slack link buttons. */
export function buildIdeRedirectUrl(deeplink: string): string {
  return `${getIdeRedirectOrigin()}/ide/open?to=${encodeURIComponent(deeplink)}`
}

/** Slack-safe deeplinks — https redirects to cursor:// / claude-cli://. */
export function buildSlackPromptDeeplinks(prompt: string, repo?: string) {
  const normalized = truncatePrompt(prompt, PROMPT_CARD_MAX_LENGTH)
  return {
    cursor: buildIdeRedirectUrl(buildCursorPromptUrl(normalized)),
    claude: buildIdeRedirectUrl(buildClaudeCodeUrl(normalized, repo))
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
    deeplinks: { cursor: links.cursor, claude: links.claude }
  }
}

export function truncateForSlackPreview(prompt: string, max = 500): string {
  const trimmed = prompt.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}

/** Open a custom-scheme URL without navigating the current page away. */
export function openIdeDeeplink(url: string): void {
  if (typeof window === 'undefined') return
  // location.assign hands off custom schemes more reliably than synthetic <a> clicks in Chrome
  window.location.assign(url)
}
