import { timingSafeEqual } from 'node:crypto'

/** The daily check of every template, called by the Vercel cron in `nuxt.config.ts` with `Authorization: Bearer $CRON_SECRET`. */
export default defineEventHandler(async (event) => {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    throw createError({ statusCode: 503, statusMessage: 'CRON_SECRET is not configured' })
  }
  const provided = Buffer.from(getRequestHeader(event, 'authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const result = await startTemplateChecks(getRequestURL(event, { xForwardedHost: true }).origin, { trigger: 'cron' })
  console.log(`[templates] cron queued ${result.queued.length} checks${result.runId ? ` (run ${result.runId})` : ''}`)
  return result
})
