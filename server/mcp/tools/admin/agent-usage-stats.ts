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
        inputTokens: sum(schema.agentChats.inputTokens),
        outputTokens: sum(schema.agentChats.outputTokens),
        estimatedCost: sum(schema.agentChats.estimatedCost),
        durationMs: sum(schema.agentChats.durationMs),
        requestCount: sum(schema.agentChats.requestCount)
      })
      .from(schema.agentChats)
      .where(gte(schema.agentChats.createdAt, since))

    type ProviderRow = Pick<AgentChat, 'provider' | 'model'> & {
      chats: number
      inputTokens: string | null
      outputTokens: string | null
      estimatedCost: string | null
    }

    const byProvider: ProviderRow[] = await db
      .select({
        provider: schema.agentChats.provider,
        model: schema.agentChats.model,
        chats: count(),
        inputTokens: sum(schema.agentChats.inputTokens),
        outputTokens: sum(schema.agentChats.outputTokens),
        estimatedCost: sum(schema.agentChats.estimatedCost)
      })
      .from(schema.agentChats)
      .where(gte(schema.agentChats.createdAt, since))
      .groupBy(schema.agentChats.provider, schema.agentChats.model)
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
        upvotes: sql<number>`sum(case when ${schema.agentVotes.isUpvoted} = 1 then 1 else 0 end)`,
        downvotes: sql<number>`sum(case when ${schema.agentVotes.isUpvoted} = 0 then 1 else 0 end)`
      })
      .from(schema.agentVotes)
      .innerJoin(schema.agentChats, eq(schema.agentChats.id, schema.agentVotes.chatId))
      .where(gte(schema.agentChats.createdAt, since))

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
