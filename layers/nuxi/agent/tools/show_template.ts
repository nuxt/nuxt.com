import { z } from 'zod'
import { defineNuxtTool } from '../lib/define-nuxt-tool.js'

export default defineNuxtTool({
  description: 'Display one or more Nuxt starter template cards with preview image, description, and action buttons. Use when the user asks about starter templates, project scaffolding, or wants to create a new Nuxt project. Pass multiple names to show several templates at once.',
  inputSchema: z.object({
    names: z.array(z.string().trim().min(1)).min(1).describe('Template names or slugs to display (e.g., ["ui", "content", "starter", "movies"])')
  }),
  path: '/api/internal/content',
  body: input => ({ kind: 'templates' as const, ...input })
})
