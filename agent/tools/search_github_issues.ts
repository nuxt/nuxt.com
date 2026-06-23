import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { internalFetch } from '../lib/internal-api.js'

export default defineTool({
  description: 'Search GitHub Issues across the Nuxt ecosystem (nuxt, nuxt-modules, nuxt-content orgs). Use when the user shares an error message, stack trace, or debugging question. Returns matching issues with status, labels, and body excerpts. Much faster and cheaper than web search for Nuxt-specific bugs.',
  inputSchema: z.object({
    query: z.string().describe('Error message, keyword, or search term'),
    repo: z.string().optional().describe('Scope to a specific repo (e.g. "nuxt/nuxt", "nuxt/ui"). Omit to search all Nuxt orgs.'),
    state: z.enum(['open', 'closed', 'all']).optional().describe('Filter by issue state')
  }),
  async execute({ query, repo, state = 'all' }) {
    return await internalFetch<Record<string, unknown>>(
      '/api/internal/github/search-issues',
      {
        method: 'POST',
        body: JSON.stringify({ query, repo, state })
      }
    )
  }
})
