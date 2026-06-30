export const MAX_PROMPT_LENGTH = 5000

const REPO_PATTERN = /^[a-zA-Z0-9-]+\/[a-zA-Z0-9-_.]+$/

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

/** Cursor deeplink — aligned with Nuxt UI ProsePrompt. */
export function buildCursorPromptUrl(prompt: string): string {
  const url = new URL('cursor://anysphere.cursor-deeplink/prompt')
  url.searchParams.set('text', truncatePrompt(prompt))
  return url.toString()
}

/** Claude Code terminal deeplink — https://code.claude.com/docs/en/deep-links */
export function buildClaudeCodeUrl(prompt: string, repo?: string): string {
  const url = new URL('claude-cli://open')
  url.searchParams.set('q', truncatePrompt(prompt))
  const normalizedRepo = normalizeRepo(repo)
  if (normalizedRepo) url.searchParams.set('repo', normalizedRepo)
  return url.toString()
}

export function buildIdeDeeplinks(prompt: string, repo?: string) {
  return {
    cursor: buildCursorPromptUrl(prompt),
    claude: buildClaudeCodeUrl(prompt, repo)
  }
}

export function truncateForSlackPreview(prompt: string, max = 500): string {
  const trimmed = prompt.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}
