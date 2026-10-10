import { z } from 'zod'
import { isNuxtersPeriod } from '#shared/utils/nuxters'

/**
 * Called by `syncNuxtersWorkflow` after an import: regenerate the ISR entries of the leaderboards it changed.
 * Profile pages (one per contributor) expire with their own ISR window instead.
 */
export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const { periods } = await readValidatedBody(event, z.object({
    periods: z.array(z.string().refine(isNuxtersPeriod)).default([])
  }).parse)

  const bypassToken = process.env.VERCEL_BYPASS_TOKEN
  if (import.meta.dev || !bypassToken) {
    return { purged: [] }
  }

  // `/nuxters` without a query shows the default period.
  const pages = ['/nuxters', ...periods.map(period => `/nuxters?period=${period}`)]
  const buildId = useRuntimeConfig(event).app.buildId
  const paths = [...pages, payloadUrlForPage('/nuxters', buildId)]
  const baseURL = `${getRequestProtocol(event)}://${getRequestHost(event, { xForwardedHost: true })}`
  const headers: Record<string, string> = { 'x-prerender-revalidate': bypassToken }
  if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    headers['x-vercel-protection-bypass'] = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  }

  await Promise.all(paths.map(path => $fetch(path, { baseURL, headers })))
  return { purged: paths }
})
