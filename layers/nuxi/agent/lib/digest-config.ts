import { timingSafeEqual } from 'node:crypto'
import type { ScheduleHandlerArgs } from 'eve/schedules'

const DEFAULT_SLACK_CHANNEL_ID = 'C0BDR6WNXC3'
const DEFAULT_SINCE_DAYS = 7

export type DigestMode = 'smoke' | 'weekly'

export function digestSlackChannelId(): string {
  return process.env.NUXT_DIGEST_SLACK_CHANNEL_ID?.trim() || DEFAULT_SLACK_CHANNEL_ID
}

export function digestSinceDays(): number {
  const raw = process.env.NUXT_DIGEST_SINCE_DAYS?.trim()
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_SINCE_DAYS
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_SINCE_DAYS
  return Math.min(parsed, 60)
}

export function scheduleAppAuth(): ScheduleHandlerArgs['appAuth'] {
  return {
    authenticator: 'app',
    principalId: 'eve:app',
    principalType: 'runtime'
  }
}

export function isManualDigestTriggerAllowed(): boolean {
  if (process.env.NUXT_DIGEST_MANUAL_TRIGGER === '1') return true
  return process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'development'
}

function safeBearerMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function bearerSecret(req: Request): string | undefined {
  const authorization = req.headers.get('authorization')?.trim()
  if (!authorization?.toLowerCase().startsWith('bearer ')) return undefined
  return authorization.slice('Bearer '.length).trim() || undefined
}

export function verifyDigestTriggerAuth(req: Request): boolean {
  const token = bearerSecret(req)
  if (!token) return false

  const internalSecret = process.env.INTERNAL_API_SECRET?.trim()
  if (internalSecret && safeBearerMatch(token, internalSecret)) return true

  const adminToken = process.env.NUXT_MCP_ADMIN_TOKEN?.trim()
  if (adminToken && safeBearerMatch(token, adminToken)) return true

  return false
}

export function buildDigestPrompt(options: { mode: DigestMode, sinceDays?: number }): string {
  const sinceDays = options.sinceDays ?? digestSinceDays()

  if (options.mode === 'smoke') {
    return `You are running a scheduled Nuxi digest (smoke test). Post ONE message to this Slack channel.

Steps:
1. Call \`admin_mcp__feedback_stats\` with \`sinceDays=${sinceDays}\`, \`topPages=3\`.
2. Call \`admin_mcp__agent_usage_stats\` with \`sinceDays=${sinceDays}\`.

Post a single Slack message titled **Nuxi digest (smoke test)** with:
- **Docs** — total feedback, positive %, average score, worst page (title + path + 1-line takeaway)
- **Agent** — web chats saved, upvotes vs downvotes, downvote rate
- For runs, tokens, cost, or Slack traffic: point to **Vercel Observability → Agent Runs** (nuxt project). Do not invent numbers from local DB.

Use **bold** for section labels. Do NOT use markdown # headings. One message only — not a thread per section.`
  }

  return `You are running the scheduled Nuxi weekly digest. Post ONE polished message to this Slack channel.

1. Call \`load_skill\` for \`weekly-digest\` if you have not already.
2. Follow that skill for the last ${sinceDays} days.
3. Adapt the output for Slack: use **bold** for section titles instead of markdown # headings.
4. One message only — not a thread per section.`
}
