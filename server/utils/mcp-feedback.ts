import { and, eq, gte, sql, type SQL } from 'drizzle-orm'

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/** Max MCP feedback reports per fingerprint per calendar day (UTC). */
export const MCP_FEEDBACK_DAILY_LIMIT = 10

/** Nuxi reports for every conversation at once, so it shares a wider quota. */
export const NUXI_FEEDBACK_DAILY_LIMIT = 100

/** Fixed key so the daily dedup collapses the same gap across conversations. */
export const NUXI_FEEDBACK_FINGERPRINT = 'nuxi'

export function mcpFeedbackDailyLimit(source: McpFeedbackSource): number {
  return source === 'nuxi' ? NUXI_FEEDBACK_DAILY_LIMIT : MCP_FEEDBACK_DAILY_LIMIT
}

function dayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Atomically increments the per-fingerprint daily counter and throws once the
 * limit is exceeded. Uses the same insert-then-upsert-in-a-transaction pattern
 * as `consumeAgentRateLimitForUser` to avoid a check-then-insert race between
 * concurrent calls from the same fingerprint.
 */
export async function consumeMcpFeedbackRateLimit(fingerprint: string, limit = MCP_FEEDBACK_DAILY_LIMIT): Promise<{ used: number, remaining: number, limit: number }> {
  const key = dayKey()

  return await db.transaction(async (tx: DbTransaction) => {
    await tx.insert(schema.mcpFeedbackDailyUsage).values({ fingerprint, dayKey: key, count: 1 })
      .onConflictDoUpdate({
        target: [schema.mcpFeedbackDailyUsage.fingerprint, schema.mcpFeedbackDailyUsage.dayKey],
        set: { count: sql`${schema.mcpFeedbackDailyUsage.count} + 1` }
      })

    const [row] = await tx.select().from(schema.mcpFeedbackDailyUsage)
      .where(and(eq(schema.mcpFeedbackDailyUsage.fingerprint, fingerprint), eq(schema.mcpFeedbackDailyUsage.dayKey, key)))

    const used = row!.count
    if (used > limit) {
      throw createError({
        statusCode: 429,
        message: `Daily MCP feedback limit of ${limit} reached. Try again tomorrow.`
      })
    }
    return { used, remaining: limit - used, limit }
  })
}

/** Skip inserting (and consuming quota for) an exact repeat of the same report from the same fingerprint today. */
export async function findDuplicateMcpFeedback(fingerprint: string, feedback: string, toolName?: string, path?: string) {
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)

  const conditions: SQL[] = [
    eq(schema.mcpFeedback.fingerprint, fingerprint),
    eq(schema.mcpFeedback.feedback, feedback),
    gte(schema.mcpFeedback.createdAt, startOfDay)
  ]
  if (toolName) conditions.push(eq(schema.mcpFeedback.toolName, toolName))
  if (path) conditions.push(eq(schema.mcpFeedback.path, path))

  const [existing] = await db.select({ id: schema.mcpFeedback.id })
    .from(schema.mcpFeedback)
    .where(and(...conditions))
    .limit(1)

  return existing
}
