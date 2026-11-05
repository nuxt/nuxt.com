import { z } from 'zod'

/** Called by `syncNuxtersWorkflow`: import the changed period files and profiles of a nuxt/nuxters commit. */
export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const { sha, force } = await readValidatedBody(event, z.object({
    sha: z.string().regex(/^[0-9a-f]{40}$/i).optional(),
    force: z.boolean().optional()
  }).parse)

  const result = await syncNuxters({ sha, force })
  const summary = result.imported.map(file => `${file.period}=${file.count}`).join(' ') || 'nothing'
  const removed = result.removed.length ? `, removed ${result.removed.join(' ')}` : ''
  const profiles = result.profiles === null ? '' : `, ${result.profiles} profiles`
  console.log(`[nuxters] sync ${result.commitSha}: imported ${summary}${removed}${profiles}, ${result.unchanged} unchanged`)
  return result
})
