import { tool } from 'ai'
import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'
import type { H3Event } from 'h3'

export function createShowHostingTool(event: H3Event) {
  return tool({
    description: 'Display a hosting/deployment provider card with logo, description, and deploy links. Use when the user asks about deploying a Nuxt app, hosting options, or a specific provider (Vercel, Netlify, Cloudflare, etc.).',
    inputSchema: z.object({
      name: z.string().trim().min(1).describe('The hosting provider name (e.g., "vercel", "netlify", "cloudflare")')
    }),
    execute: async ({ name }) => {
      const needle = name.trim().toLowerCase()
      const providers = await queryCollection(event, 'deploy').all()
      const provider = providers.find(p =>
        p.path !== '/deploy'
        && (
          p.title?.toLowerCase() === needle
          || p.path?.toLowerCase().endsWith(`/${needle}`)
          || p.title?.toLowerCase().includes(needle)
        )
      )

      if (!provider) {
        return { error: `Hosting provider "${name}" not found` }
      }

      return {
        title: provider.title,
        description: provider.description,
        path: provider.path,
        logoSrc: provider.logoSrc,
        logoIcon: provider.logoIcon,
        category: provider.category,
        nitroPreset: provider.nitroPreset,
        website: provider.website
      }
    }
  })
}
