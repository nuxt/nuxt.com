import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { internalFetch } from '../lib/internal-api.js'

export default defineTool({
  description: 'Display a hosting/deployment provider card with logo, description, and deploy links. Use when the user asks about deploying a Nuxt app, hosting options, or a specific provider (Vercel, Netlify, Cloudflare, etc.).',
  inputSchema: z.object({
    name: z.string().trim().min(1).describe('The hosting provider name (e.g., "vercel", "netlify", "cloudflare")')
  }),
  async execute({ name }) {
    return await internalFetch<Record<string, unknown>>(
      '/api/internal/content/deploy',
      {
        method: 'POST',
        body: JSON.stringify({ name })
      }
    )
  }
})
