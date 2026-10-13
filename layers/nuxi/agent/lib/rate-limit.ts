import { appOrigin, internalHeaders } from './internal-api.js'

export const DAILY_LIMIT_MESSAGE = 'You\'ve reached today\'s message limit with Nuxi. Try again tomorrow.'

/**
 * Counts one user message against the principal's daily quota. `error` means the
 * quota couldn't be checked; callers let the message through rather than block chat.
 */
export async function consumeDailyQuota(principalId: string, defaultLimit?: number): Promise<'ok' | 'limited' | 'error'> {
  try {
    // No inbound browser request here, so the cookie cannot be forwarded. The
    // consume route accepts the bearer secret alone for these callers.
    const response = await fetch(`${appOrigin()}/api/internal/agent/rate-limit/consume`, {
      method: 'POST',
      headers: internalHeaders(),
      body: JSON.stringify({ userId: principalId, defaultLimit })
    })

    if (response.status === 429) return 'limited'
    if (response.ok) return 'ok'

    console.warn('[nuxi:rate-limit] quota check failed', response.status, await response.text())
    return 'error'
  } catch (error) {
    console.warn('[nuxi:rate-limit] quota check failed', error)
    return 'error'
  }
}
