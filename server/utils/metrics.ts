import { metric } from '@vercel/functions'

/**
 * Report an elapsed time to Vercel Observability, and hand it back for logging.
 *
 * `metric()` talks to the runtime over an IPC global that only exists on Vercel, so this is a
 * no-op locally rather than an error.
 */
export function recordDuration(name: string, startedAt: number, tags?: Record<string, string>): number {
  const ms = Math.round(performance.now() - startedAt)
  metric(name, ms, tags)

  return ms
}
