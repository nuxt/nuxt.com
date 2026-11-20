import { byPrincipal, defineDynamicSchedules } from 'eve/experimental/schedules'
import { z } from 'zod'
import slack from '../channels/slack.js'
import { resolveContext } from '../lib/identity/context.js'
import { slackApi } from '../lib/slack/api.js'
import { lookupSlackMember } from '../lib/slack/members.js'

interface TaskPayload {
  task: string
  teamId: string
  userId: string
  channelId: string
  /** Set when results go back to the thread the schedule was created in. */
  threadTs?: string
}

function attribute(attributes: Readonly<Record<string, unknown>> | undefined, key: string) {
  const value = attributes?.[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

const MEMBER_PAGES = 10

interface ConversationsInfoResponse {
  ok: boolean
  error?: string
  channel?: { is_private?: boolean, is_im?: boolean, is_mpim?: boolean }
}

interface ConversationsMembersResponse {
  ok: boolean
  error?: string
  members?: string[]
  response_metadata?: { next_cursor?: string }
}

/**
 * Whether the creator can still see the schedule's conversation. A member can read any public
 * channel and a DM with the app is theirs, so only private channels and group DMs need a
 * membership check: without it, someone removed from a private channel would keep posting there
 * through Nuxi. Needs `groups:read` and `mpim:read`. Errors other than a missing channel throw,
 * so the provider retries instead of reading an outage as a denial.
 */
async function canReachChannel(payload: TaskPayload): Promise<boolean> {
  const info = await slackApi<ConversationsInfoResponse>('conversations.info', { channel: payload.channelId })
  if (!info.ok) {
    if (info.error === 'channel_not_found') return false
    throw new Error(`Slack conversations.info failed: ${info.error ?? 'unknown error'}`)
  }
  const channel = info.channel
  if (!channel) return false
  if (channel.is_im || (!channel.is_private && !channel.is_mpim)) return true

  let cursor: string | undefined
  for (let page = 0; page < MEMBER_PAGES; page++) {
    const response = await slackApi<ConversationsMembersResponse>('conversations.members', {
      channel: payload.channelId,
      limit: 1000,
      ...(cursor ? { cursor } : {})
    })
    if (!response.ok) {
      if (response.error === 'channel_not_found') return false
      throw new Error(`Slack conversations.members failed: ${response.error ?? 'unknown error'}`)
    }
    if (response.members?.includes(payload.userId)) return true
    cursor = response.response_metadata?.next_cursor || undefined
    if (!cursor) return false
  }
  // Too large to check: fail closed.
  return false
}

/**
 * Schedules the team creates by asking in Slack ("every Monday at 9, post open showcase
 * candidates here"). The model calls the generated `schedule__tasks__*` tools; each run starts a
 * new session in the Slack conversation the schedule was created in, as its creator. The fixed
 * workflows (digest, showcase…) stay as code in the other files here.
 */
export default defineDynamicSchedules({
  description:
    'Scheduled tasks and reminders that run later and post in the Slack conversation where they were created. '
    + 'Use the person\'s time zone for single and cron timing, and ask for it when you don\'t know it. '
    + 'Write the task as a complete request to your future self: no one will be present to answer questions or approve actions when it runs.',
  // Kept out of the always-on tool list: web chat and Discord can't use them, and `scope` denies them there.
  tool: 'deferred',
  inputSchema: z.object({
    task: z.string().min(1).max(4000).describe('What to do each time the schedule runs.'),
    reply: z.enum(['new_thread', 'this_thread']).default('new_thread')
      .describe('Post each run as a new thread in this conversation, or reply in the current thread.')
  }).strict(),
  // Each person sees and manages only their own schedules, and only from Slack, where
  // `channels/slack.ts` already admitted them as full workspace members.
  scope(ctx) {
    const context = resolveContext(ctx.session.auth.current)
    if (context.surface !== 'slack' || !context.person || context.person.isBot) return null
    return byPrincipal(ctx)
  },
  // The destination and creator come from the trusted Slack session, never from the model,
  // so a schedule can only post where its creator asked for it.
  preparePayload(input, { session }): TaskPayload {
    if (session.schedule) throw new Error('Scheduled runs can\'t create or replace schedules.')
    const auth = session.auth.current
    const teamId = auth?.issuer?.startsWith('slack:') ? auth.issuer.slice('slack:'.length) : undefined
    const userId = attribute(auth?.attributes, 'user_id')
    const channelId = attribute(auth?.attributes, 'channel_id')
    const threadTs = attribute(auth?.attributes, 'thread_ts')
    if (auth?.principalType !== 'user' || !teamId || !userId || !channelId) {
      throw new Error('Schedules can only be created from a Slack message.')
    }
    const payload: TaskPayload = { task: input.task, teamId, userId, channelId }
    if (input.reply === 'this_thread' && threadTs) payload.threadTs = threadTs
    return payload
  },
  // Before every run: still the same person, still a full member, still in the conversation.
  // A permanent denial disables the schedule; a failed lookup throws, so the run is retried.
  async auth({ principal, payload, schedule }) {
    if (principal.principalId !== `slack:${payload.teamId}:${payload.userId}`) return null
    const member = await lookupSlackMember(payload.userId)
    if (!member.fullMember || !(await canReachChannel(payload))) {
      await schedule.disable()
      return null
    }
    return {
      attributes: {
        author_type: 'user',
        channel_id: payload.channelId,
        user_id: payload.userId,
        ...(member.name ? { full_name: member.name } : {})
      }
    }
  },
  async run({ payload, occurrence, to }) {
    await to(slack, {
      channelId: payload.channelId,
      installationTeamId: payload.teamId,
      threadTs: payload.threadTs
    }).send(
      [
        `Run this scheduled task for <@${payload.userId}> now and post the result.`,
        'If the task says to stay quiet when there\'s nothing to report and there isn\'t, call `no_reply` instead.',
        'No one is present to answer questions or approve actions. If you can\'t finish, say what\'s missing.',
        `Schedule: ${occurrence.displayName ?? occurrence.name}`,
        `Scheduled for: ${occurrence.scheduledAt}`,
        `Task: ${payload.task}`
      ].join('\n'),
      // Provider retries reuse the key, so a retried run reaches the same thread.
      { idempotencyKey: `${occurrence.executionId}:run` }
    )
  }
})
