import { timingSafeEqual } from 'node:crypto'
import type { ScheduleHandlerArgs } from 'eve/schedules'
import slack from '../channels/slack.js'
import { discordWorkflowChannelId, mirrorDigestToDiscord } from './discord-workflow.js'
import { resolveSlackChannelRef, workflowSlackChannelRef } from './slack-api.js'

const DEFAULT_SINCE_DAYS = 7

/** Eve schedule app principal — same shape as `appAuth` in schedule handlers. */
export const scheduleAppAuth = {
  authenticator: 'app',
  principalId: 'eve:app',
  principalType: 'runtime'
} as const satisfies ScheduleHandlerArgs['appAuth']

export function defaultSinceDays(): number {
  const raw = process.env.NUXT_WORKFLOW_SINCE_DAYS?.trim()
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_SINCE_DAYS
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_SINCE_DAYS
  return Math.min(parsed, 365)
}

export type ParseWindowResult
  = | { ok: true, value: number | undefined }
    | { ok: false, error: string }

export function parseSinceDays(value: string | null | undefined): ParseWindowResult {
  if (!value?.trim()) return { ok: true, value: undefined }
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return { ok: false, error: 'sinceDays must be a positive integer' }
  }
  return { ok: true, value: Math.min(parsed, 365) }
}

export function resolveSinceDays(
  override: number | undefined,
  fallback: number = defaultSinceDays()
): number {
  return override ?? fallback
}

/**
 * Starts a Slack digest session and, when `DISCORD_WORKFLOW_CHANNEL_ID` is
 * configured, mirrors the same generated text to Discord (see
 * `discord-workflow.ts` — no second agent run). Awaited inline rather than
 * fired under a nested `waitUntil`: this whole function already runs inside
 * the caller's top-level `waitUntil(runWeeklyDigest(...))`, and a second,
 * deeply-nested `waitUntil` call turned out not to reliably survive the
 * schedule's durable step execution (Discord mirror silently never ran,
 * no error logged). Awaiting here keeps the mirror inside that same
 * protected async chain instead of relying on a second background task.
 */
export async function receiveOnSlack({
  receive,
  appAuth,
  message,
  channelRef
}: {
  receive: ScheduleHandlerArgs['receive']
  appAuth: ScheduleHandlerArgs['appAuth']
  message: string
  channelRef?: string
}) {
  const resolved = await resolveSlackChannelRef(channelRef ?? workflowSlackChannelRef())

  const session = await receive(slack, {
    auth: appAuth,
    target: { channelId: resolved.id },
    message
  })

  const discordChannelId = discordWorkflowChannelId()
  if (discordChannelId) {
    await mirrorDigestToDiscord({ session, channelId: discordChannelId })
  }

  return session
}

export function isManualWorkflowTriggerAllowed(): boolean {
  if (process.env.NUXT_WORKFLOW_MANUAL_TRIGGER === '1') return true
  return process.env.VERCEL_ENV === 'preview'
}

function safeBearerMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function verifyWorkflowTriggerAuth(req: Request): boolean {
  const authorization = req.headers.get('authorization')?.trim()
  if (!authorization?.toLowerCase().startsWith('bearer ')) return false
  const token = authorization.slice('Bearer '.length).trim()
  if (!token) return false

  const internalSecret = process.env.INTERNAL_API_SECRET?.trim()
  if (internalSecret && safeBearerMatch(token, internalSecret)) return true

  const adminToken = process.env.NUXT_MCP_ADMIN_TOKEN?.trim()
  if (adminToken && safeBearerMatch(token, adminToken)) return true

  return false
}

export function parseSinceHours(value: string | null | undefined): ParseWindowResult {
  if (!value?.trim()) return { ok: true, value: undefined }
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return { ok: false, error: 'sinceHours must be a positive integer' }
  }
  return { ok: true, value: Math.min(parsed, 168) }
}

const SLACK_WORKFLOW_DELIVERY = `Your text reply is posted verbatim to this Slack channel by Eve — there is no Slack post tool and you do not need one. Output only the formatted summary from the skill. Never say you cannot post, never mention missing tools, never ask anyone to copy-paste, and never add a "Note:" about delivery.`

/** Prompt prefix shared by scheduled Slack workflows. */
export function skillWorkflowMessage(skillId: string, sinceDays: number): string {
  return `Load the \`${skillId}\` skill and follow it for the last ${sinceDays} days.

${SLACK_WORKFLOW_DELIVERY}`
}

export function skillFirehoseWorkflowMessage(
  skillId: string,
  sinceHours: number,
  firehoseChannelName: string
): string {
  return `Load the \`${skillId}\` skill and follow it for the last ${sinceHours} hours.

Use \`read_slack_channel_history\` on channel \`${firehoseChannelName}\` with sinceHours=${sinceHours}.

${SLACK_WORKFLOW_DELIVERY}`
}
