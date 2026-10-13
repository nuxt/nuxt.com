import { defineDynamic, defineTool } from 'eve/tools'
import { z } from 'zod'
import { isAdminMode } from '../lib/identity/admin-mode.js'
import {
  fetchSlackChannelHistory,
  firehoseSlackChannelRef,
  resolveSlackChannelRef
} from '../lib/slack/api.js'

export default defineDynamic({
  events: {
    'session.started': async (_event, ctx) => {
      if (!(await isAdminMode(ctx.session.auth.current))) return null

      return {
        read_slack_channel_history: defineTool({
          description: 'Read recent messages from a Slack channel by name (e.g. firehose-nuxt, #help-nuxt) or channel ID. Returns text, permalink (Slack archive link), links (URLs from text + Block Kit buttons/attachments), and tweetUrls (post URLs only: https://x.com/<handle>/status/<id> or t.co — use these verbatim for "view on X"; profile URLs like twitter.com/handle are in links but NOT in tweetUrls) per message.',
          inputSchema: z.object({
            channel: z.string().optional().describe('Slack channel name or ID. Defaults to the firehose channel.'),
            sinceHours: z.number().int().min(1).max(168).default(24),
            limit: z.number().int().min(1).max(200).default(200)
          }),
          async execute({ channel, sinceHours, limit }) {
            const resolved = await resolveSlackChannelRef(channel ?? await firehoseSlackChannelRef())
            const messages = await fetchSlackChannelHistory({
              channelId: resolved.id,
              sinceHours,
              limit
            })

            return {
              channel: resolved.ref,
              channelId: resolved.id,
              channelName: resolved.name,
              sinceHours,
              messageCount: messages.length,
              messages
            }
          }
        })
      }
    }
  }
})
