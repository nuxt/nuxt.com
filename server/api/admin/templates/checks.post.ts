import { z } from 'zod'

/** Starts a run over every template, the ones listed in `slugs`, or only those that don't pass (`failing`). One run at a time. */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const options = await readValidatedBody(event, z.object({
    slugs: z.array(z.string().regex(/^[a-z0-9-]+$/)).max(500).optional(),
    failing: z.boolean().optional()
  }).optional().parse) ?? {}

  const result = await startTemplateChecks(getRequestURL(event, { xForwardedHost: true }).origin, { ...options, trigger: 'admin', startedBy: user.username })
  console.log(`[templates] admin ${user.username} queued ${result.queued.length} checks${result.runId ? ` (run ${result.runId})` : ''}`)
  setResponseStatus(event, result.runId ? 202 : 200)
  return result
})
