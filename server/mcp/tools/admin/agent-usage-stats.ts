import { z } from 'zod'
import { count, desc, eq, gte, sql, sum } from 'drizzle-orm'

export default defineMcpTool({
  description: `Aggregated AI agent usage stats over a time window: total chats, tokens, cost, average duration, breakdown by provider/model, and daily request counts.

WHEN TO USE: Use this tool to monitor AI agent traffic, spend, and provider mix.`,
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

    const [globalRow] = await db
      .select({
        chats: count(),
        inputTokens: sum(schema.chats.inputTokens),
        outputTokens: sum(schema.chats.outputTokens),
        estimatedCost: sum(schema.chats.estimatedCost),
        durationMs: sum(schema.chats.durationMs),
        requestCount: sum(schema.chats.requestCount)
      })
      .from(schema.chats)
      .where(gte(schema.chats.createdAt, since))

    type ProviderRow = Pick<Chat, 'provider' | 'model'> & {
      chats: number
      inputTokens: string | null
      outputTokens: string | null
      estimatedCost: string | null
    }

    const byProvider: ProviderRow[] = await db
      .select({
        provider: schema.chats.provider,
        model: schema.chats.model,
        chats: count(),
        inputTokens: sum(schema.chats.inputTokens),
        outputTokens: sum(schema.chats.outputTokens),
        estimatedCost: sum(schema.chats.estimatedCost)
      })
      .from(schema.chats)
      .where(gte(schema.chats.createdAt, since))
      .groupBy(schema.chats.provider, schema.chats.model)
      .orderBy(desc(count()))

    const dailyUsage = await db
      .select({
        dayKey: schema.agentDailyUsage.dayKey,
        count: schema.agentDailyUsage.count
      })
      .from(schema.agentDailyUsage)
      .where(gte(schema.agentDailyUsage.dayKey, since.toISOString().slice(0, 10)))
      .orderBy(desc(schema.agentDailyUsage.dayKey))

    const [voteRow] = await db
      .select({
        upvotes: sql<number>`sum(case when ${schema.votes.isUpvoted} = 1 then 1 else 0 end)`,
        downvotes: sql<number>`sum(case when ${schema.votes.isUpvoted} = 0 then 1 else 0 end)`
      })
      .from(schema.votes)
      .innerJoin(schema.chats, eq(schema.chats.id, schema.votes.chatId))
      .where(gte(schema.chats.createdAt, since))

    const totalChats = Number(globalRow?.chats ?? 0)

    return {
      window: { sinceDays, since: since.toISOString() },
      global: {
        chats: totalChats,
        inputTokens: Number(globalRow?.inputTokens ?? 0),
        outputTokens: Number(globalRow?.outputTokens ?? 0),
        estimatedCost: Math.round(Number(globalRow?.estimatedCost ?? 0) * 1_000_000) / 1_000_000,
        averageDurationMs: totalChats ? Math.round(Number(globalRow?.durationMs ?? 0) / totalChats) : 0,
        requestCount: Number(globalRow?.requestCount ?? 0)
      },
      votes: {
        upvotes: Number(voteRow?.upvotes ?? 0),
        downvotes: Number(voteRow?.downvotes ?? 0)
      },
      byProvider: byProvider.map((r: ProviderRow) => ({
        provider: r.provider,
        model: r.model,
        chats: r.chats,
        inputTokens: Number(r.inputTokens ?? 0),
        outputTokens: Number(r.outputTokens ?? 0),
        estimatedCost: Math.round(Number(r.estimatedCost ?? 0) * 1_000_000) / 1_000_000
      })),
      dailyUsage
    }
  }
})
