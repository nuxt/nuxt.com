import { z } from 'zod'
import { desc, eq, gte, sql, sum } from 'drizzle-orm'
import { ANON_AGENT_STATS_USER_ID } from '#layers/nuxi/server/utils/stats'

export default defineMcpTool({
  description: `Aggregated AI agent usage stats over a time window: chats started, requests, errors, tokens, cost, breakdown by provider/model, daily volume, and the share of anonymous vs signed-in traffic. Data lives in the permanent \`agent_stats\` table, so it survives chat deletion and includes anonymous visitors.

WHEN TO USE: Use this tool to monitor AI agent traffic, spend, provider mix, and login mix.`,
  inputSchema: {
    sinceDays: z.number().int().min(1).max(365).default(30).describe('Window in days from now (default 30).')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  inputExamples: [
    { sinceDays: 7 },
    { sinceDays: 30 }
  ],
  enabled: event => isMcpAdmin(event),
  async handler({ sinceDays }) {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)
    const sinceKey = since.toISOString().slice(0, 10)

    const [globalRow] = await db
      .select({
        chatsStarted: sum(schema.agentStats.chatsStarted),
        requestCount: sum(schema.agentStats.requestCount),
        errorCount: sum(schema.agentStats.errorCount),
        inputTokens: sum(schema.agentStats.inputTokens),
        outputTokens: sum(schema.agentStats.outputTokens),
        estimatedCost: sum(schema.agentStats.estimatedCost),
        durationMs: sum(schema.agentStats.durationMs)
      })
      .from(schema.agentStats)
      .where(gte(schema.agentStats.dayKey, sinceKey))

    const byProvider = await db
      .select({
        provider: schema.agentStats.provider,
        model: schema.agentStats.model,
        chatsStarted: sum(schema.agentStats.chatsStarted),
        requestCount: sum(schema.agentStats.requestCount),
        inputTokens: sum(schema.agentStats.inputTokens),
        outputTokens: sum(schema.agentStats.outputTokens),
        estimatedCost: sum(schema.agentStats.estimatedCost)
      })
      .from(schema.agentStats)
      .where(gte(schema.agentStats.dayKey, sinceKey))
      .groupBy(schema.agentStats.provider, schema.agentStats.model)
      .orderBy(desc(sum(schema.agentStats.requestCount)))

    const dailyUsage = await db
      .select({
        dayKey: schema.agentStats.dayKey,
        chatsStarted: sum(schema.agentStats.chatsStarted),
        requestCount: sum(schema.agentStats.requestCount),
        errorCount: sum(schema.agentStats.errorCount)
      })
      .from(schema.agentStats)
      .where(gte(schema.agentStats.dayKey, sinceKey))
      .groupBy(schema.agentStats.dayKey)
      .orderBy(desc(schema.agentStats.dayKey))

    const [anonRow] = await db
      .select({
        chatsStarted: sum(schema.agentStats.chatsStarted),
        requestCount: sum(schema.agentStats.requestCount)
      })
      .from(schema.agentStats)
      .where(sql`${schema.agentStats.dayKey} >= ${sinceKey} AND ${schema.agentStats.userId} = ${ANON_AGENT_STATS_USER_ID}`)

    const [loggedRow] = await db
      .select({
        chatsStarted: sum(schema.agentStats.chatsStarted),
        requestCount: sum(schema.agentStats.requestCount),
        uniqueUsers: sql<number>`count(distinct ${schema.agentStats.userId})`
      })
      .from(schema.agentStats)
      .where(sql`${schema.agentStats.dayKey} >= ${sinceKey} AND ${schema.agentStats.userId} != ${ANON_AGENT_STATS_USER_ID}`)

    const [voteRow] = await db
      .select({
        upvotes: sql<number>`sum(case when ${schema.votes.isUpvoted} = 1 then 1 else 0 end)`,
        downvotes: sql<number>`sum(case when ${schema.votes.isUpvoted} = 0 then 1 else 0 end)`
      })
      .from(schema.votes)
      .innerJoin(schema.chats, eq(schema.chats.id, schema.votes.chatId))
      .where(gte(schema.chats.createdAt, since))

    const totalChats = Number(globalRow?.chatsStarted ?? 0)
    const totalRequests = Number(globalRow?.requestCount ?? 0)

    return {
      window: { sinceDays, since: since.toISOString() },
      global: {
        chatsStarted: totalChats,
        requestCount: totalRequests,
        errorCount: Number(globalRow?.errorCount ?? 0),
        inputTokens: Number(globalRow?.inputTokens ?? 0),
        outputTokens: Number(globalRow?.outputTokens ?? 0),
        estimatedCost: Math.round(Number(globalRow?.estimatedCost ?? 0) * 1_000_000) / 1_000_000,
        averageDurationMs: totalRequests ? Math.round(Number(globalRow?.durationMs ?? 0) / totalRequests) : 0
      },
      audience: {
        anonymous: {
          chatsStarted: Number(anonRow?.chatsStarted ?? 0),
          requestCount: Number(anonRow?.requestCount ?? 0)
        },
        signedIn: {
          uniqueUsers: Number(loggedRow?.uniqueUsers ?? 0),
          chatsStarted: Number(loggedRow?.chatsStarted ?? 0),
          requestCount: Number(loggedRow?.requestCount ?? 0)
        }
      },
      votes: {
        upvotes: Number(voteRow?.upvotes ?? 0),
        downvotes: Number(voteRow?.downvotes ?? 0)
      },
      byProvider: byProvider.map((r: typeof byProvider[number]) => ({
        provider: r.provider,
        model: r.model,
        chatsStarted: Number(r.chatsStarted ?? 0),
        requestCount: Number(r.requestCount ?? 0),
        inputTokens: Number(r.inputTokens ?? 0),
        outputTokens: Number(r.outputTokens ?? 0),
        estimatedCost: Math.round(Number(r.estimatedCost ?? 0) * 1_000_000) / 1_000_000
      })),
      dailyUsage: dailyUsage.map((r: typeof dailyUsage[number]) => ({
        dayKey: r.dayKey,
        chatsStarted: Number(r.chatsStarted ?? 0),
        requestCount: Number(r.requestCount ?? 0),
        errorCount: Number(r.errorCount ?? 0)
      }))
    }
  }
})
