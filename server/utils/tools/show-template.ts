import { tool } from 'ai'
import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'
import type { H3Event } from 'h3'

export function createShowTemplateTool(event: H3Event) {
  return tool({
    description: 'Display one or more Nuxt starter template cards with preview image, description, and action buttons. Use when the user asks about starter templates, project scaffolding, or wants to create a new Nuxt project. Pass multiple names to show several templates at once.',
    inputSchema: z.object({
      names: z.array(z.string().trim().min(1)).min(1).describe('Template names or slugs to display (e.g., ["ui", "content", "starter", "movies"])')
    }),
    execute: async ({ names }) => {
      const allTemplates = await queryCollection(event, 'templates').all()

      const results = names.map((rawName) => {
        const name = rawName.trim().toLowerCase()
        const template = allTemplates.find(t =>
          t.slug.toLowerCase() === name
          || t.name.toLowerCase() === name
          || t.slug.toLowerCase().includes(name)
          || t.name.toLowerCase().includes(name)
        )

        if (!template) return null

        return {
          name: template.name,
          slug: template.slug,
          description: template.description,
          repo: template.repo,
          demo: template.demo,
          badge: template.badge,
          purchase: template.purchase
        }
      }).filter(Boolean)

      if (!results.length) {
        return { error: `No templates found matching: ${names.join(', ')}` }
      }

      return { templates: results }
    }
  })
}
