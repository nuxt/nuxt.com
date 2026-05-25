import { sql } from 'drizzle-orm'

export const ANON_AGENT_STATS_USER_ID = '__anonymous__'

export interface BumpStatsInput {
  userId: string | null
  isFirstMessage: boolean
  provider?: string | null
  model?: string | null
  inputTokens?: number
  outputTokens?: number
  estimatedCost?: number
  durationMs?: number
  isError?: boolean
}

export async function bumpAgentStats(input: BumpStatsInput): Promise<void> {
  const dayKey = new Date().toISOString().slice(0, 10)
  const userId = input.userId ?? ANON_AGENT_STATS_USER_ID
  const provider = input.provider ?? 'unknown'
  const model = input.model ?? 'unknown'
  const chatsStartedDelta = input.isFirstMessage ? 1 : 0
  const requestDelta = input.isError ? 0 : 1
  const errorDelta = input.isError ? 1 : 0
  const inputTokensDelta = input.inputTokens ?? 0
  const outputTokensDelta = input.outputTokens ?? 0
  const costDelta = input.estimatedCost ?? 0
  const durationDelta = input.durationMs ?? 0

  await db.insert(schema.agentStats).values({
    dayKey,
    userId,
    provider,
    model,
    chatsStarted: chatsStartedDelta,
    requestCount: requestDelta,
    errorCount: errorDelta,
    inputTokens: inputTokensDelta,
    outputTokens: outputTokensDelta,
    estimatedCost: costDelta,
    durationMs: durationDelta
  }).onConflictDoUpdate({
    target: [schema.agentStats.dayKey, schema.agentStats.userId, schema.agentStats.provider, schema.agentStats.model],
    set: {
      chatsStarted: sql`${schema.agentStats.chatsStarted} + ${chatsStartedDelta}`,
      requestCount: sql`${schema.agentStats.requestCount} + ${requestDelta}`,
      errorCount: sql`${schema.agentStats.errorCount} + ${errorDelta}`,
      inputTokens: sql`${schema.agentStats.inputTokens} + ${inputTokensDelta}`,
      outputTokens: sql`${schema.agentStats.outputTokens} + ${outputTokensDelta}`,
      estimatedCost: sql`${schema.agentStats.estimatedCost} + ${costDelta}`,
      durationMs: sql`${schema.agentStats.durationMs} + ${durationDelta}`
    }
  })
}
