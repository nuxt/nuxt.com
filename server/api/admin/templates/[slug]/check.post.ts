import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { user } = await requireAdminUserSession(event)
  const { slug } = await getValidatedRouterParams(event, z.object({ slug: z.string().regex(/^[a-z0-9-]+$/) }).parse)
  const result = await startTemplateChecks({ slugs: [slug], trigger: 'admin', startedBy: user.username })
  if (!result.queued.length && !result.skipped.length) {
    throw createError({ statusCode: 404, statusMessage: 'No checkable template found' })
  }
  setResponseStatus(event, 202)
  return result
})
