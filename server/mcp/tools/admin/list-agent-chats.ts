import { z } from 'zod'
import { and, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm'

export default defineMcpTool({
  description: `Lists AI agent chat sessions with usage metrics (tokens, cost, duration) and per-chat upvote/downvote counts. Does not include the full message bodies — use \`admin_get_agent_chat\` for that.

WHEN TO USE: Use this tool to find expensive sessions, slow sessions, or sessions with negative votes. Combine \`hasDownvotes\` with \`sinceDays\` to surface recent quality issues.`,
  inputSchema: {
    sinceDays: z.number().int().min(1).max(365).optional().describe('Only include chats from the last N days.'),
    until: z.string().datetime({ offset: true }).optional().describe('Upper bound on createdAt as an ISO 8601 datetime.'),
    provider: z.string().optional().describe('Filter by AI provider (e.g., "openai", "anthropic").'),
    model: z.string().optional().describe('Filter by AI model (e.g., "gpt-4o", "claude-sonnet-4-5").'),
    hasDownvotes: z.boolean().optional().describe('If true, only return chats that have at least one downvoted message.'),
    sortBy: z.enum(['createdAt', 'updatedAt', 'estimatedCost', 'durationMs', 'inputTokens', 'outputTokens']).default('updatedAt').describe('Sort field (default updatedAt, descending).'),
    limit: z.number().int().min(1).max(100).default(25).describe('Maximum number of chats to return.'),
    offset: z.number().int().min(0).default(0).describe('Pagination offset.')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  inputExamples: [
    { sinceDays: 7, hasDownvotes: true },
    { provider: 'openai', sortBy: 'estimatedCost', limit: 10 }
  ],
  enabled: event => isMcpAdmin(event),
  async handler({ sinceDays, until, provider, model, hasDownvotes, sortBy, limit, offset }) {
    const filters: SQL[] = []
    if (sinceDays) {
      const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)
      filters.push(gte(schema.agentChats.createdAt, since))
    }
    if (until) filters.push(lte(schema.agentChats.createdAt, new Date(until)))
    if (provider) filters.push(eq(schema.agentChats.provider, provider))
    if (model) filters.push(eq(schema.agentChats.model, model))

    const sortColumn = {
      createdAt: schema.agentChats.createdAt,
      updatedAt: schema.agentChats.updatedAt,
      estimatedCost: schema.agentChats.estimatedCost,
      durationMs: schema.agentChats.durationMs,
      inputTokens: schema.agentChats.inputTokens,
      outputTokens: schema.agentChats.outputTokens
    }[sortBy]

    const upvotesExpr = sql<number>`coalesce(sum(case when ${schema.agentVotes.isUpvoted} = 1 then 1 else 0 end), 0)`
    const downvotesExpr = sql<number>`coalesce(sum(case when ${schema.agentVotes.isUpvoted} = 0 then 1 else 0 end), 0)`

    type ChatRow = Omit<AgentChat, 'messages'> & {
      messageCount: number
      upvotes: number
      downvotes: number
    }

    const rows: ChatRow[] = await db
      .select({
        id: schema.agentChats.id,
        fingerprint: schema.agentChats.fingerprint,
        model: schema.agentChats.model,
        provider: schema.agentChats.provider,
        inputTokens: schema.agentChats.inputTokens,
        outputTokens: schema.agentChats.outputTokens,
        estimatedCost: schema.agentChats.estimatedCost,
        durationMs: schema.agentChats.durationMs,
        requestCount: schema.agentChats.requestCount,
        messageCount: sql<number>`json_array_length(${schema.agentChats.messages})`,
        upvotes: upvotesExpr,
        downvotes: downvotesExpr,
        createdAt: schema.agentChats.createdAt,
        updatedAt: schema.agentChats.updatedAt
      })
      .from(schema.agentChats)
      .leftJoin(schema.agentVotes, eq(schema.agentVotes.chatId, schema.agentChats.id))
      .where(filters.length ? and(...filters) : undefined)
      .groupBy(schema.agentChats.id)
      .having(hasDownvotes ? sql`${downvotesExpr} > 0` : undefined)
      .orderBy(desc(sortColumn))
      .limit(limit)
      .offset(offset)

    return {
      total: rows.length,
      offset,
      limit,
      rows: rows.map((r: ChatRow) => ({
        ...r,
        upvotes: Number(r.upvotes),
        downvotes: Number(r.downvotes),
        messageCount: Number(r.messageCount),
        estimatedCost: Math.round(Number(r.estimatedCost) * 1_000_000) / 1_000_000
      }))
    }
  }
})
