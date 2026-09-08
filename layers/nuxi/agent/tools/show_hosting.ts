import { z } from 'zod'
import { defineNuxtTool } from '../lib/define-nuxt-tool.js'

export default defineNuxtTool({
  description: 'Display a hosting/deployment provider card with logo, description, and deploy links. Use when the user asks about deploying a Nuxt app, hosting options, or a specific provider (Vercel, Netlify, Cloudflare, etc.).',
  inputSchema: z.object({
    name: z.string().trim().min(1).describe('The hosting provider name (e.g., "vercel", "netlify", "cloudflare")')
  }),
  path: '/api/internal/content',
  body: input => ({ kind: 'deploy' as const, ...input })
})
