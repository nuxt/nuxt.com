const RATE_LIMITED_ERROR_NAME = 'NuxiRateLimitedError'

/** Thrown by the rate-limit hook when a web visitor runs out of daily messages. */
export class RateLimitedError extends Error {
  override name = RATE_LIMITED_ERROR_NAME
}

/**
 * Lifecycle events carry the error after eve serialized it, so this checks the
 * shape rather than `instanceof`. The message fallback covers both the hook's
 * default and the consume route's 429 wording, in case `name` is dropped.
 */
export function isRateLimitedError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  if ('name' in error && error.name === RATE_LIMITED_ERROR_NAME) return true
  return 'message' in error && typeof error.message === 'string' && /daily (?:message )?limit/i.test(error.message)
}
