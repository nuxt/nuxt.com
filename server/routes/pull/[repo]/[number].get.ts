import { pullBasePath } from '#shared/utils/pull'

/**
 * `/pull/:repo/:number` itself mirrors no page: land on the first one the PR changes.
 * Deeper paths fall through to the renderer (`app/plugins/pull-preview.server.ts`).
 */
export default defineEventHandler(async (event) => {
  const target = pullTargetFromEvent(event)
  const preview = await resolvePullPreview(target)

  return sendRedirect(event, `${pullBasePath(target)}${await pullLandingPath(preview)}`, 302)
})
