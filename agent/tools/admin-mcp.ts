import { createMCPClient } from '@ai-sdk/mcp'
import { defineDynamic, defineTool } from 'eve/tools'
import { z } from 'zod'
import { appOrigin } from '../lib/internal-api.js'

type AuthAttributes = Readonly<Record<string, string | readonly string[]>>

interface AdminAuth {
  issuer?: string
  attributes?: AuthAttributes
}

function authAttr(attributes: AuthAttributes | undefined, key: string): string | undefined {
  const value = attributes?.[key]
  return typeof value === 'string' ? value : undefined
}

export function canAccessAdminMcp(auth: AdminAuth | null | undefined): boolean {
  if (!auth) return false
  if (auth.issuer?.startsWith('slack:') || auth.issuer === 'slack') return true
  if (authAttr(auth.attributes, 'team_id')) return true
  return authAttr(auth.attributes, 'role') === 'admin'
}

export const ADMIN_MCP_INSTRUCTIONS = `**Admin tools (team only):**
- \`admin_mcp__feedback_stats\` — aggregated docs feedback metrics
- \`admin_mcp__list_feedback\` — individual feedback entries
- \`admin_mcp__agent_usage_stats\` — Nuxi usage and cost
- \`admin_mcp__list_agent_chats\` / \`admin_mcp__get_agent_chat\` — chat sessions and transcripts
- \`admin_mcp__list_agent_votes\` — message upvotes/downvotes
- Default to recent data (last 7–30 days) unless the user asks for a longer window
- Always include direct links (path / chat id) so the team can drill down on nuxt.com`

async function callAdminMcpTool(toolName: string, input: Record<string, unknown>): Promise<unknown> {
  const token = process.env.NUXT_MCP_ADMIN_TOKEN?.trim()
  if (!token) throw new Error('NUXT_MCP_ADMIN_TOKEN is not configured')

  const client = await createMCPClient({
    transport: {
      type: 'http',
      url: `${appOrigin()}/mcp/admin`,
      headers: { Authorization: `Bearer ${token}` }
    }
  })

  try {
    const tools = await client.tools()
    const tool = tools[toolName]
    if (!tool?.execute) throw new Error(`Unknown admin MCP tool: ${toolName}`)
    return await tool.execute(input, { toolCallId: crypto.randomUUID(), messages: [] })
  } finally {
    await client.close()
  }
}

const feedbackRating = z.enum(['very-helpful', 'helpful', 'not-helpful', 'confusing'])

function adminTools() {
  return {
    feedback_stats: defineTool({
      description: 'Admin: aggregated docs feedback metrics (ratings, worst pages, satisfaction score).',
      inputSchema: z.object({
        sinceDays: z.number().int().min(1).max(365).default(30),
        topPages: z.number().int().min(1).max(50).default(10),
        minResponses: z.number().int().min(1).default(3)
      }),
      async execute(input) {
        return await callAdminMcpTool('feedback-stats', input)
      }
    }),
    list_feedback: defineTool({
      description: 'Admin: list docs feedback entries with filters for rating, path, and date range.',
      inputSchema: z.object({
        ratings: z.array(feedbackRating).optional(),
        pathContains: z.string().optional(),
        sinceDays: z.number().int().min(1).max(365).optional(),
        until: z.string().datetime({ offset: true }).optional(),
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0)
      }),
      async execute(input) {
        return await callAdminMcpTool('list-feedback', input)
      }
    }),
    agent_usage_stats: defineTool({
      description: 'Admin: aggregated Nuxi usage stats (chats, tokens, cost, provider mix).',
      inputSchema: z.object({
        sinceDays: z.number().int().min(1).max(365).default(30)
      }),
      async execute(input) {
        return await callAdminMcpTool('agent-usage-stats', input)
      }
    }),
    list_agent_chats: defineTool({
      description: 'Admin: list Nuxi chat sessions with usage metrics and vote counts.',
      inputSchema: z.object({
        sinceDays: z.number().int().min(1).max(365).optional(),
        until: z.string().datetime({ offset: true }).optional(),
        provider: z.string().optional(),
        model: z.string().optional(),
        hasDownvotes: z.boolean().optional(),
        sortBy: z.enum(['createdAt', 'updatedAt', 'estimatedCost', 'durationMs', 'inputTokens', 'outputTokens']).default('updatedAt'),
        limit: z.number().int().min(1).max(100).default(25),
        offset: z.number().int().min(0).default(0)
      }),
      async execute(input) {
        return await callAdminMcpTool('list-agent-chats', input)
      }
    }),
    get_agent_chat: defineTool({
      description: 'Admin: read a full Nuxi chat transcript and message-level votes.',
      inputSchema: z.object({
        chatId: z.string().min(1),
        includeRawParts: z.boolean().default(false)
      }),
      async execute(input) {
        return await callAdminMcpTool('get-agent-chat', input)
      }
    }),
    list_agent_votes: defineTool({
      description: 'Admin: list per-message upvotes/downvotes on Nuxi answers.',
      inputSchema: z.object({
        onlyDownvotes: z.boolean().default(false),
        onlyUpvotes: z.boolean().default(false),
        sinceDays: z.number().int().min(1).max(365).optional(),
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0)
      }),
      async execute(input) {
        return await callAdminMcpTool('list-agent-votes', input)
      }
    })
  }
}

export default defineDynamic({
  events: {
    'session.started': async (_event, ctx) => {
      if (!canAccessAdminMcp(ctx.session.auth.current)) return null
      return adminTools()
    }
  }
})
