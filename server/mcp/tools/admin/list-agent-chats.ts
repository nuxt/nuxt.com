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
      filters.push(gte(schema.chats.createdAt, since))
    }
    if (until) filters.push(lte(schema.chats.createdAt, new Date(until)))
    if (provider) filters.push(eq(schema.chats.provider, provider))
    if (model) filters.push(eq(schema.chats.model, model))

    const sortColumn = {
      createdAt: schema.chats.createdAt,
      updatedAt: schema.chats.updatedAt,
      estimatedCost: schema.chats.estimatedCost,
      durationMs: schema.chats.durationMs,
      inputTokens: schema.chats.inputTokens,
      outputTokens: schema.chats.outputTokens
    }[sortBy]

    const upvotesExpr = sql<number>`coalesce(sum(case when ${schema.votes.isUpvoted} = 1 then 1 else 0 end), 0)`
    const downvotesExpr = sql<number>`coalesce(sum(case when ${schema.votes.isUpvoted} = 0 then 1 else 0 end), 0)`
    const messageCountExpr = sql<number>`(select count(*) from ${schema.messages} where ${schema.messages.chatId} = ${schema.chats.id})`

    type ChatRow = Chat & {
      messageCount: number
      upvotes: number
      downvotes: number
    }

    const rows: ChatRow[] = await db
      .select({
        id: schema.chats.id,
        userId: schema.chats.userId,
        title: schema.chats.title,
        visibility: schema.chats.visibility,
        model: schema.chats.model,
        provider: schema.chats.provider,
        inputTokens: schema.chats.inputTokens,
        outputTokens: schema.chats.outputTokens,
        estimatedCost: schema.chats.estimatedCost,
        durationMs: schema.chats.durationMs,
        requestCount: schema.chats.requestCount,
        messageCount: messageCountExpr,
        upvotes: upvotesExpr,
        downvotes: downvotesExpr,
        createdAt: schema.chats.createdAt,
        updatedAt: schema.chats.updatedAt
      })
      .from(schema.chats)
      .leftJoin(schema.votes, eq(schema.votes.chatId, schema.chats.id))
      .where(filters.length ? and(...filters) : undefined)
      .groupBy(schema.chats.id)
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
