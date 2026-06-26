import type { H3Event } from 'h3'
import { and, eq, sql } from 'drizzle-orm'

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

const DEFAULT_DAILY_LIMIT = 20

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

async function resolveIdentity(event: H3Event): Promise<string> {
  return await resolveSessionPrincipalId(event)
}

export async function checkAgentRateLimit(event: H3Event): Promise<{ used: number, remaining: number, limit: number }> {
  const userId = await resolveIdentity(event)
  const dayKey = today()
  const [row] = await db.select().from(schema.agentDailyUsage)
    .where(and(eq(schema.agentDailyUsage.userId, userId), eq(schema.agentDailyUsage.dayKey, dayKey)))
    .limit(1)
  const limit = row?.limitOverride ?? DEFAULT_DAILY_LIMIT
  const used = row?.count ?? 0
  return { used, remaining: Math.max(0, limit - used), limit }
}

export async function consumeAgentRateLimitForUser(userId: string): Promise<{ used: number, remaining: number, limit: number }> {
  const dayKey = today()

  return await db.transaction(async (tx: DbTransaction) => {
    await tx.insert(schema.agentDailyUsage).values({ userId, dayKey, count: 1 })
      .onConflictDoUpdate({
        target: [schema.agentDailyUsage.userId, schema.agentDailyUsage.dayKey],
        set: { count: sql`${schema.agentDailyUsage.count} + 1` }
      })
    const [row] = await tx.select().from(schema.agentDailyUsage)
      .where(and(eq(schema.agentDailyUsage.userId, userId), eq(schema.agentDailyUsage.dayKey, dayKey)))
    const limit = row?.limitOverride ?? DEFAULT_DAILY_LIMIT
    const used = row!.count
    if (used > limit) {
      throw createError({
        statusCode: 429,
        message: `You've reached the daily limit of ${limit} messages. Try again tomorrow.`
      })
    }
    return { used, remaining: limit - used, limit }
  })
}

export async function consumeAgentRateLimit(event: H3Event): Promise<{ used: number, remaining: number, limit: number }> {
  const userId = await resolveIdentity(event)
  return consumeAgentRateLimitForUser(userId)
}
