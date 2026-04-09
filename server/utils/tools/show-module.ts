import { tool } from 'ai'
import { z } from 'zod'
import type { UIToolInvocation } from 'ai'

export type ShowModuleUIToolInvocation = UIToolInvocation<typeof showModuleTool>

export const showModuleTool = tool({
  description: 'Display a Nuxt module card with install command. Use this tool when the user asks about installing, using, or recommending a specific Nuxt module. The card shows the module icon, description, stats, and a copy-able install command.',
  inputSchema: z.object({
    name: z.string().describe('The module name/slug (e.g., "pinia", "i18n", "content")')
  }),
  execute: async ({ name }) => {
    const data = await $fetch<Record<string, unknown>>(`https://api.nuxt.com/modules/${name}`).catch(() => null)

    if (!data) {
      return { error: `Module "${name}" not found` }
    }

    const stats = data.stats as Record<string, unknown> | undefined

    return {
      name: data.name as string,
      npm: data.npm as string,
      description: data.description as string,
      icon: data.icon as string,
      category: data.category as string,
      repo: data.repo as string,
      website: data.website as string,
      downloads: stats?.downloads as number | undefined,
      stars: stats?.stars as number | undefined
    }
  }
})
