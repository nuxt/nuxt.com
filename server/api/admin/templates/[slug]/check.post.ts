import { z } from 'zod'
import { createError, defineHandler, setResponseStatus, getRequestURL } from 'nuxt/server'

export default defineHandler(async (event) => {
  const { user } = await requireAdminUserSession(event)
  const { slug } = await getValidatedParams(event, z.object({ slug: z.string().regex(/^[a-z0-9-]+$/) }).parse)
  const result = await startTemplateChecks(templateCheckBaseURL(getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin), { slugs: [slug], trigger: 'admin', startedBy: user.username })
  if (!result.queued.length && !result.skipped.length) {
    throw createError({ status: 404, statusText: 'No checkable template found' })
  }
  setResponseStatus(event, 202)
  return result
})
