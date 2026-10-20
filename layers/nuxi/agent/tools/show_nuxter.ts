import { z } from 'zod'
import { defineNuxtTool } from '../lib/define-nuxt-tool.js'

export default defineNuxtTool({
  description: 'Display a Nuxter card: a contributor to the Nuxt ecosystem with their rank, score, merged PRs, issues, comments, reactions and modules, linking to their profile. Use it when the user asks about a specific contributor (by GitHub username), or about themselves when you know their username.',
  inputSchema: z.object({
    username: z.string().trim().min(1).max(39).describe('GitHub username, case-insensitive (e.g., "danielroe")'),
    period: z.string().optional().describe('"all" (default), "30d", "12m", or a year from 2016 such as "2024"')
  }),
  path: '/api/internal/nuxters/card'
})
