import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { internalFetch } from '../lib/internal-api.js'

export default defineTool({
  description: 'Display a rich blog post card with image, title, date, and author. Use when the user asks about Nuxt blog posts, release announcements, tutorials, or when referencing a specific blog article.',
  inputSchema: z.object({
    title: z.string().describe('The blog post title or search keyword (e.g., "v4", "Nuxt 3.15", "TypeScript")')
  }),
  async execute({ title }) {
    return await internalFetch<Record<string, unknown>>(
      '/api/internal/content/blog-post',
      {
        method: 'POST',
        body: JSON.stringify({ title })
      }
    )
  }
})
