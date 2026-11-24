import { defineDynamic, defineTool } from 'eve/tools'
import { z } from 'zod'
import { assertAdminMode, isAdminMode } from '../lib/identity/admin-mode.js'
import { resolveContext } from '../lib/identity/context.js'
import { slackApi } from '../lib/slack/api.js'

interface SearchContextMessage {
  author_name?: string
  author_user_id?: string
  channel_id?: string
  channel_name?: string
  message_ts?: string
  content?: string
  permalink?: string
  reply_count?: number
}

interface SearchContextResponse {
  ok: boolean
  error?: string
  results?: { messages?: SearchContextMessage[] }
}

const UNAVAILABLE = {
  no_token: 'Slack search needs a fresh Slack message: it works only in a turn started by a mention or DM. Use `read_slack_channel_history` for a channel you know, and report the search as unavailable, never as "nothing found".',
  expired: 'The Slack search authorization from this message has expired. Don\'t retry `search_slack` this turn: answer from what you already found and say which searches couldn\'t run.',
  missing_scope: 'The Slack app is missing the `search:read.public` scope. Say that an admin needs to add it to the `slack/nuxi` connector.'
} as const

/**
 * Slack's Real-time Search API (`assistant.search.context`): past discussions and decisions in
 * public channels, with permalinks to cite. With a bot token, Slack requires the short-lived
 * `action_token` of the message that started the turn, which `defaultSlackAuth` copies into the
 * turn's auth. Needs the `search:read.public` bot scope. Slack-only and admin-only, like
 * `read_slack_channel_history`.
 */
export default defineDynamic(async (ctx) => {
  const auth = ctx.session.auth.current
  if (resolveContext(auth).surface !== 'slack') return null
  if (!(await ctx.memo(ctx.turn?.id ?? null, () => isAdminMode(auth)))) return null

  return {
    search_slack: defineTool({
      label: { start: () => 'Searching Slack', complete: () => 'Searched Slack' },
      description: 'Search messages in public Slack channels across the workspace, best match first: past discussions, decisions, and who said what. Never searches private channels or DMs. The authorization expires a few minutes after the message, so run every search you need early. Each result has the channel, author, text, timestamp and a permalink to cite inline. Read a channel in full with `read_slack_channel_history`.',
      inputSchema: z.object({
        query: z.string().min(1).max(500).describe('What to look for, in natural language. Slack modifiers like `in:#channel` and `on:YYYY-MM-DD` also work.'),
        limit: z.number().int().min(1).max(20).optional().describe('Maximum results. Default 10.')
      }),
      async execute({ query, limit }, toolCtx) {
        const current = toolCtx.session.auth.current
        await assertAdminMode(current)
        const actionToken = current?.attributes?.action_token
        if (resolveContext(current).surface !== 'slack' || typeof actionToken !== 'string' || !actionToken) {
          return { unavailable: true, message: UNAVAILABLE.no_token }
        }

        const response = await slackApi<SearchContextResponse>('assistant.search.context', {
          query,
          action_token: actionToken,
          // Keep the public-only boundary in code even if the app gains broader search scopes.
          channel_types: 'public_channel',
          limit: limit ?? 10
        })

        if (!response.ok) {
          if (response.error === 'invalid_action_token') return { unavailable: true, message: UNAVAILABLE.expired }
          if (response.error === 'missing_scope') return { unavailable: true, message: UNAVAILABLE.missing_scope }
          throw new Error(`Slack search failed: ${response.error ?? 'unknown error'}`)
        }

        return {
          matches: (response.results?.messages ?? []).map(message => ({
            channelId: message.channel_id,
            channelName: message.channel_name,
            author: message.author_name,
            authorUserId: message.author_user_id,
            ts: message.message_ts,
            text: message.content ?? '',
            permalink: message.permalink,
            replyCount: message.reply_count
          }))
        }
      }
    })
  }
})
