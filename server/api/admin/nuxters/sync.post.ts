import { z } from 'zod'
import { start } from 'workflow/api'
import { syncNuxtersWorkflow } from '../../../workflows/sync-nuxters'

/**
 * Start a Nuxters import as a signed-in admin, without any secret: for the first import
 * after a deploy, or to import again. Same workflow as the nuxt/nuxters push webhook.
 *
 * From the browser console of a signed-in admin:
 *   await $fetch('/api/admin/nuxters/sync', { method: 'POST' })
 *   await $fetch('/api/admin/nuxters/sync', { method: 'POST', body: { force: true } })
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const { sha, force } = await readValidatedBody(event, z.object({
    sha: z.string().regex(/^[0-9a-f]{40}$/i).optional(),
    force: z.boolean().optional()
  }).optional().parse) ?? {}

  const baseURL = `${getRequestProtocol(event)}://${getRequestHost(event, { xForwardedHost: true })}`
  const run = await start(syncNuxtersWorkflow, [{ baseURL, sha, force }])

  console.log(`[nuxters] admin ${user.username} started workflow run ${run.runId}${force ? ' (force)' : ''}`)
  setResponseStatus(event, 202)
  return { ok: true, runId: run.runId, sha: sha ?? 'latest', force: !!force }
})
