import { z } from 'zod'
import { and, desc, eq, gte, lte, sql, type SQL } from 'drizzle-orm'

export default defineMcpTool({
  description: `Lists persisted **web** chat sessions (signed-in users on nuxt.com) with message counts and vote tallies. Does not include Slack threads or Vercel o11y runs — use Observability → Agent Runs for those.

WHEN TO USE: Find web chats with downvotes or read metadata before opening a full transcript via \`get-agent-chat\`.`,
  inputSchema: {
    sinceDays: z.number().int().min(1).max(365).optional().describe('Only include chats from the last N days.'),
    until: z.string().datetime({ offset: true }).optional().describe('Upper bound on createdAt as an ISO 8601 datetime.'),
    hasDownvotes: z.boolean().optional().describe('If true, only return chats that have at least one downvoted message.'),
    sortBy: z.enum(['createdAt', 'updatedAt']).default('updatedAt').describe('Sort field (default updatedAt, descending).'),
    limit: z.number().int().min(1).max(100).default(25).describe('Maximum number of chats to return.'),
    offset: z.number().int().min(0).default(0).describe('Pagination offset.')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  inputExamples: [
    { sinceDays: 7, hasDownvotes: true },
    { sinceDays: 30, sortBy: 'createdAt', limit: 10 }
  ],
  enabled: event => isMcpAdmin(event),
  async handler({ sinceDays, until, hasDownvotes, sortBy, limit, offset }) {
    const filters: SQL[] = []
    if (sinceDays) {
      const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)
      filters.push(gte(schema.chats.createdAt, since))
    }
    if (until) filters.push(lte(schema.chats.createdAt, new Date(until)))

    const sortColumn = {
      createdAt: schema.chats.createdAt,
      updatedAt: schema.chats.updatedAt
    }[sortBy]

    const upvotesExpr = sql<number>`coalesce(sum(case when ${schema.votes.isUpvoted} = 1 then 1 else 0 end), 0)`
    const downvotesExpr = sql<number>`coalesce(sum(case when ${schema.votes.isUpvoted} = 0 then 1 else 0 end), 0)`
    const messageCountExpr = sql<number>`(select count(*) from ${schema.messages} where ${schema.messages.chatId} = ${schema.chats.id})`

    type ChatRow = Pick<Chat, 'id' | 'userId' | 'title' | 'visibility' | 'createdAt' | 'updatedAt'> & {
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
        id: r.id,
        userId: r.userId,
        title: r.title,
        visibility: r.visibility,
        messageCount: Number(r.messageCount),
        upvotes: Number(r.upvotes),
        downvotes: Number(r.downvotes),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        url: `https://nuxt.com/dashboard/chat/${r.id}`
      }))
    }
  }
})
