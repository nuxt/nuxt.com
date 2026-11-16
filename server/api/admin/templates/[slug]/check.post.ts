import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (user.role !== 'admin' || !await isAuthorizedAdmin(event, user.username)) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }
  const { slug } = await getValidatedRouterParams(event, z.object({ slug: z.string().regex(/^[a-z0-9-]+$/) }).parse)
  const result = await startTemplateChecks(templateCheckBaseURL(event), { slugs: [slug], trigger: 'admin', startedBy: user.username })
  if (!result.queued.length && !result.skipped.length) {
    throw createError({ statusCode: 404, statusMessage: 'No checkable template found' })
  }
  setResponseStatus(event, 202)
  return result
})
