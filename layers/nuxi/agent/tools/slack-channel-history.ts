import { defineDynamic, defineTool } from 'eve/tools'
import { z } from 'zod'
import { canAccessAdminMcp } from '../lib/admin-mcp-access.js'
import {
  fetchSlackChannelHistory,
  firehoseSlackChannelRef,
  resolveSlackChannelRef
} from '../lib/slack-api.js'

export default defineDynamic({
  events: {
    'session.started': async (_event, ctx) => {
      if (!canAccessAdminMcp(ctx.session.auth.current)) return null

      return {
        read_slack_channel_history: defineTool({
          description: 'Read recent messages from a Slack channel by name (e.g. firehose-nuxt, #help-nuxt) or channel ID. Returns text, permalink (Slack archive link), and extracted tweet/article URLs per message.',
          inputSchema: z.object({
            channel: z.string().optional().describe('Slack channel name or ID. Defaults to the firehose channel.'),
            sinceHours: z.number().int().min(1).max(168).default(24),
            limit: z.number().int().min(1).max(200).default(200)
          }),
          async execute({ channel, sinceHours, limit }) {
            const resolved = await resolveSlackChannelRef(channel ?? firehoseSlackChannelRef())
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
