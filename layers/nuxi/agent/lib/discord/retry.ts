import { RateLimitError } from 'chat'

const MAX_ATTEMPTS = 3
const FALLBACK_DELAY_MS = 1000
/** Discord buckets recover in seconds; a longer wait means the turn is lost anyway. */
const MAX_DELAY_MS = 10_000

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retries a Discord write on HTTP 429, honouring `retryAfterMs`.
 *
 * A digest is delivered as several sequential posts (2000-char chunks), so one
 * rate-limited call in the middle silently truncated the message.
 */
export async function withDiscordRetry<T>(label: string, operation: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (!(error instanceof RateLimitError) || attempt >= MAX_ATTEMPTS) throw error

      const delay = Math.min(error.retryAfterMs ?? FALLBACK_DELAY_MS, MAX_DELAY_MS)
      console.warn(`[nuxi:discord] rate limited on ${label}, retrying in ${delay}ms`, { attempt })
      await sleep(delay)
    }
  }
}
