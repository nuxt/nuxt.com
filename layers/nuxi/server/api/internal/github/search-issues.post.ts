import { z } from 'zod'
import { defineHandler, readValidatedBody } from 'nuxt/server'

export default defineHandler(async (event) => {
  requireInternalRequest(event)

  const body = await readValidatedBody(event, z.object({
    query: z.string().min(1),
    repo: z.string().optional(),
    state: z.enum(['open', 'closed', 'all']).optional()
  }).parse)

  return await searchGitHubIssues(body)
})
