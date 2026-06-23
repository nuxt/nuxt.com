import { z } from 'zod'

export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const body = await readValidatedBody(event, z.object({
    query: z.string(),
    repo: z.string().optional(),
    state: z.enum(['open', 'closed', 'all']).optional()
  }).parse)

  return await searchGitHubIssues(event, body)
})
