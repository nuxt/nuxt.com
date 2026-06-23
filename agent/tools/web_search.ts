import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { internalFetch } from '../lib/internal-api.js'

export default defineTool({
  description: 'Search the web for recent information beyond the Nuxt docs. Only use when the user explicitly asks about recent events or real-time data, or when search_github_issues returned no results.',
  inputSchema: z.object({
    query: z.string().describe('Search query — match the user\'s wording; do not add calendar years unless they asked for one')
  }),
  async execute({ query }) {
    return await internalFetch<Record<string, unknown>>(
      '/api/internal/agent/web-search',
      {
        method: 'POST',
        body: JSON.stringify({ query })
      }
    )
  }
})
