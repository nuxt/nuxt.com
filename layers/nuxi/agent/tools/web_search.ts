import { z } from 'zod'
import { defineNuxtTool } from '../lib/define-nuxt-tool.js'

export default defineNuxtTool({
  description: 'Search the web for recent information beyond the Nuxt docs. Only use when the user explicitly asks about recent events or real-time data, or when search_github_issues returned no results.',
  inputSchema: z.object({
    query: z.string().describe('Search query — match the user\'s wording; do not add calendar years unless they asked for one')
  }),
  path: '/api/internal/agent/web-search'
})
