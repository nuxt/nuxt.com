import { defineDynamic, defineTool } from 'eve/tools'
import { z } from 'zod'
import { canAccessAdminMcp } from '../lib/admin-mcp-access.js'
import { fetchSlackChannelHistory, firehoseSlackChannelId } from '../lib/slack-api.js'

export default defineDynamic({
  events: {
    'session.started': async (_event, ctx) => {
      if (!canAccessAdminMcp(ctx.session.auth.current)) return null

      return {
        read_slack_channel_history: defineTool({
          description: 'Read recent messages from a Slack channel (e.g. #firehose-nuxt). Returns text, permalink (Slack archive link), and extracted tweet/article URLs per message.',
          inputSchema: z.object({
            channelId: z.string().optional().describe('Slack channel ID. Defaults to the firehose channel.'),
            sinceHours: z.number().int().min(1).max(168).default(24),
            limit: z.number().int().min(1).max(200).default(200)
          }),
          async execute({ channelId, sinceHours, limit }) {
            const messages = await fetchSlackChannelHistory({
              channelId: channelId ?? firehoseSlackChannelId(),
              sinceHours,
              limit
            })

            return {
              channelId: channelId ?? firehoseSlackChannelId(),
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
