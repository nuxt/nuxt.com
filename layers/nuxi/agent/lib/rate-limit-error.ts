/**
 * eve rebuilds lifecycle errors as `Error(message)`, dropping `name` and the
 * protocol `code`, so the message is the only field that reaches
 * instrumentation. It is a fixed sentinel rather than the consume route's 429
 * text: users never see it (the prompt only uses the error to disable itself,
 * the banner reads the usage endpoint), and an exact match can't swallow an
 * unrelated failure that happens to mention a limit.
 */
const RATE_LIMITED_MESSAGE = '[nuxi:rate-limited] Daily message limit reached.'

/** Thrown by the rate-limit hook when a web visitor runs out of daily messages. */
export class RateLimitedError extends Error {
  constructor() {
    super(RATE_LIMITED_MESSAGE)
    this.name = 'RateLimitedError'
  }
}

export function isRateLimitedError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'message' in error
    && error.message === RATE_LIMITED_MESSAGE
}
