import type { H3Event } from 'h3'
import { and, eq, sql } from 'drizzle-orm'

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

const DEFAULT_DAILY_LIMIT = 20

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Read the rate-limit principal from the browser session cookie — never mints. */
export async function getRateLimitPrincipalId(event: H3Event): Promise<string | undefined> {
  const session = await getUserSession(event)
  return session.user?.id ?? session.anonymousUserId
}

/** Mint a stable anonymous id in the browser session — browser-facing routes only. */
export async function ensureRateLimitPrincipalId(event: H3Event): Promise<string> {
  const session = await getUserSession(event)
  if (session.user?.id) return session.user.id

  if (session.anonymousUserId) return session.anonymousUserId

  const anonymousUserId = crypto.randomUUID()
  await setUserSession(event, { anonymousUserId })
  return anonymousUserId
}

async function readUsage(userId: string, defaultLimit: number): Promise<{ used: number, remaining: number, limit: number }> {
  const [row] = await db.select().from(schema.agentDailyUsage)
    .where(and(eq(schema.agentDailyUsage.userId, userId), eq(schema.agentDailyUsage.dayKey, today())))
    .limit(1)
  const limit = row?.limitOverride ?? defaultLimit
  const used = row?.count ?? 0
  return { used, remaining: Math.max(0, limit - used), limit }
}

export async function checkAgentRateLimit(event: H3Event): Promise<{ used: number, remaining: number, limit: number }> {
  const userId = await ensureRateLimitPrincipalId(event)
  const usage = await readUsage(userId, DEFAULT_DAILY_LIMIT)

  // Anonymous visitors also share a per-IP budget (see the agent's rate-limit hook).
  const session = await getUserSession(event)
  const ip = session.user ? undefined : clientIp(name => getRequestHeader(event, name))
  const ipKey = ip ? await anonymousIpKey(ip) : undefined
  if (!ipKey) return usage

  const ipUsage = await readUsage(ipKey, ANONYMOUS_IP_DAILY_LIMIT)
  const remaining = Math.min(usage.remaining, ipUsage.remaining)
  return { used: usage.limit - remaining, remaining, limit: usage.limit }
}

export async function consumeAgentRateLimitForUser(userId: string, defaultLimit = DEFAULT_DAILY_LIMIT): Promise<{ used: number, remaining: number, limit: number }> {
  const dayKey = today()

  return await db.transaction(async (tx: DbTransaction) => {
    await tx.insert(schema.agentDailyUsage).values({ userId, dayKey, count: 1 })
      .onConflictDoUpdate({
        target: [schema.agentDailyUsage.userId, schema.agentDailyUsage.dayKey],
        set: { count: sql`${schema.agentDailyUsage.count} + 1` }
      })
    const [row] = await tx.select().from(schema.agentDailyUsage)
      .where(and(eq(schema.agentDailyUsage.userId, userId), eq(schema.agentDailyUsage.dayKey, dayKey)))
    const limit = row?.limitOverride ?? defaultLimit
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
  const userId = await ensureRateLimitPrincipalId(event)
  return consumeAgentRateLimitForUser(userId)
}
