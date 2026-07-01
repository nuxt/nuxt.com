import { timingSafeEqual } from 'node:crypto'
import type { ScheduleHandlerArgs } from 'eve/schedules'
import slack from '../channels/slack.js'
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

export function parseSinceDays(value: string | null | undefined): number | undefined {
  if (!value?.trim()) return undefined
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return undefined
  return Math.min(parsed, 365)
}

export function resolveSinceDays(
  override: number | undefined,
  fallback: number = defaultSinceDays()
): number {
  return override ?? fallback
}

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

  return receive(slack, {
    auth: appAuth,
    target: { channelId: resolved.id },
    message
  })
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

export function parseSinceHours(value: string | null | undefined): number | undefined {
  if (!value?.trim()) return undefined
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return undefined
  return Math.min(parsed, 168)
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
