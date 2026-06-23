import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { internalFetch } from '../lib/internal-api.js'

export default defineTool({
  description: 'Display one or more Nuxt starter template cards with preview image, description, and action buttons. Use when the user asks about starter templates, project scaffolding, or wants to create a new Nuxt project. Pass multiple names to show several templates at once.',
  inputSchema: z.object({
    names: z.array(z.string().trim().min(1)).min(1).describe('Template names or slugs to display (e.g., ["ui", "content", "starter", "movies"])')
  }),
  async execute({ names }) {
    return await internalFetch<{ templates?: unknown[], error?: string }>(
      '/api/internal/content/templates',
      {
        method: 'POST',
        body: JSON.stringify({ names })
      }
    )
  }
})
