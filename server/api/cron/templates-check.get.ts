import { timingSafeEqual } from 'node:crypto'
import { createError, defineHandler, getRequestHeader, getRequestURL } from 'nuxt/server'

/** The daily check of every template, called by the Vercel cron in `nuxt.config.ts` with `Authorization: Bearer $CRON_SECRET`. */
export default defineHandler(async (event) => {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    throw createError({ status: 503, statusText: 'CRON_SECRET is not configured' })
  }
  const provided = Buffer.from(getRequestHeader(event, 'authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw createError({ status: 401, statusText: 'Unauthorized' })
  }

  const result = await startTemplateChecks(templateCheckBaseURL(getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin), { trigger: 'cron' })
  console.log(`[templates] cron queued ${result.queued.length} checks${result.runId ? ` (run ${result.runId})` : ''}`)
  return result
})
