import { tool } from 'ai'
import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'
import type { H3Event } from 'h3'

export function createShowTemplateTool(event: H3Event) {
  return tool({
    description: 'Display a Nuxt starter template card with preview image, description, and action buttons. Use when the user asks about starter templates, project scaffolding, or wants to create a new Nuxt project from a template.',
    inputSchema: z.object({
      name: z.string().describe('The template name or slug (e.g., "ui", "content", "starter")')
    }),
    execute: async ({ name }) => {
      const templates = await queryCollection(event, 'templates').all()
      const template = templates.find(t =>
        t.slug === name
        || t.name.toLowerCase() === name.toLowerCase()
        || t.slug.includes(name.toLowerCase())
        || t.name.toLowerCase().includes(name.toLowerCase())
      )

      if (!template) {
        return { error: `Template "${name}" not found` }
      }

      return {
        name: template.name,
        slug: template.slug,
        description: template.description,
        repo: template.repo,
        demo: template.demo,
        badge: template.badge,
        purchase: template.purchase
      }
    }
  })
}
