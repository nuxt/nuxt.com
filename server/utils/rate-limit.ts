import type { H3Event } from 'h3'
import { kv } from 'hub:kv'

const DAILY_LIMIT = 20
const TTL_SECONDS = 86400

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
  const used = await kv.get<number>(key) || 0
  const remaining = Math.max(0, DAILY_LIMIT - used)

  return { used, remaining, limit: DAILY_LIMIT }
}

export async function consumeAgentRateLimit(event: H3Event): Promise<{ used: number, remaining: number, limit: number }> {
  const ip = resolveIP(event)
  const key = todayKey(ip)
  const used = await kv.get<number>(key) || 0

  if (used >= DAILY_LIMIT) {
    throw createError({
      statusCode: 429,
      message: `You've reached the daily limit of ${DAILY_LIMIT} messages. Try again tomorrow.`
    })
  }

  await kv.set(key, used + 1, { ttl: TTL_SECONDS })

  return { used: used + 1, remaining: DAILY_LIMIT - used - 1, limit: DAILY_LIMIT }
}
