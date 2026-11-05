import { z } from 'zod'
import { defineNuxtTool } from '../lib/define-nuxt-tool.js'

export default defineNuxtTool({
  description: 'Display a rich blog post card with image, title, date, and author. Use when the user asks about Nuxt blog posts, release announcements, tutorials, or when referencing a specific blog article.',
  inputSchema: z.object({
    title: z.string().trim().min(1).describe('The blog post title or search keyword (e.g., "v4", "Nuxt 3.15", "TypeScript")')
  }),
  path: '/api/internal/content',
  body: input => ({ kind: 'blog' as const, ...input })
})
