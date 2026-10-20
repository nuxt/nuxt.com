import { z } from 'zod'

/** Stops the checks of `slugs`, or every run. Templates keep their last result. */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const { slugs } = await readValidatedBody(event, z.object({ slugs: z.array(z.string().regex(/^[a-z0-9-]+$/)).max(500).optional() }).optional().parse) ?? {}
  const result = await stopTemplateChecks(user.username, slugs)
  console.log(`[templates] admin ${user.username} stopped ${slugs?.length ? slugs.join(', ') : 'every run'} (${result.stopped.length} checks)`)
  return result
})
