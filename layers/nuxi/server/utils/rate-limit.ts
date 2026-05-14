import type { H3Event } from 'h3'
import { eq, sql } from 'drizzle-orm'

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

const DAILY_LIMIT = 20

function todayKey(ip: string): string {
  const date = new Date().toISOString().slice(0, 10)
  return `rate:agent:${ip}:${date}`
}

function resolveIP(event: H3Event): string {
  return getRequestIP(event, { xForwardedFor: true }) || 'unknown'
}

export async function checkAgentRateLimit(event: H3Event): Promise<{ used: number, remaining: number, limit: number }> {
  const ip = resolveIP(event)
  const key = todayKey(ip)
  const rows = await db.select().from(schema.agentDailyUsage).where(eq(schema.agentDailyUsage.dayKey, key)).limit(1)
  const used = rows[0]?.count ?? 0
  const remaining = Math.max(0, DAILY_LIMIT - used)

  return { used, remaining, limit: DAILY_LIMIT }
}

export async function consumeAgentRateLimit(event: H3Event): Promise<{ used: number, remaining: number, limit: number }> {
  const ip = resolveIP(event)
  const key = todayKey(ip)

  return await db.transaction(async (tx: DbTransaction) => {
    await tx.insert(schema.agentDailyUsage).values({ dayKey: key, count: 1 })
      .onConflictDoUpdate({
        target: schema.agentDailyUsage.dayKey,
        set: { count: sql`${schema.agentDailyUsage.count} + 1` }
      })
    const [row] = await tx.select().from(schema.agentDailyUsage).where(eq(schema.agentDailyUsage.dayKey, key))
    const used = row!.count
    if (used > DAILY_LIMIT) {
      throw createError({
        statusCode: 429,
        message: `You've reached the daily limit of ${DAILY_LIMIT} messages. Try again tomorrow.`
      })
    }
    return { used, remaining: DAILY_LIMIT - used, limit: DAILY_LIMIT }
  })
}
