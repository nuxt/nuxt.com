import { z } from 'zod'
import type { Module } from '~/types'

export default defineMcpTool({
  description: `Retrieves complete details about a specific Nuxt module including README, compatibility, maintainers, and stats.

WHEN TO USE: Use this tool when you know the EXACT module identifier. Common scenarios:
- User asks for a specific module: "Get details about @nuxt/ui"
- User mentions a known module: "Show me nuxt-icon module"
- You found a relevant module from list_modules and want full details
- You need to check Nuxt 4 compatibility for a specific module

WHEN NOT TO USE: If you don't know the exact module identifier and need to search/discover modules, use list_modules first.

PARAMETER: slug (required) - The unique module identifier
EXAMPLES:
- slug: "@nuxt/ui"
- slug: "@nuxtjs/i18n"
- slug: "nuxt-icon"
- slug: "@nuxt/image"
- slug: "nuxt-auth"`,
  inputSchema: {
    slug: z.string().describe('The unique module identifier, exactly as shown in list_modules (e.g., "@nuxt/ui", "@nuxtjs/i18n", "nuxt-icon")')
  },
  cache: '1h',
  async handler({ slug }) {
    try {
      const module = await $fetch<Module>(`https://api.nuxt.com/modules/${slug}`)

      const result = {
        name: module.name,
        description: module.description,
        npm: module.npm,
        repo: module.repo,
        github: module.github,
        website: module.website,
        learn_more: module.learn_more,
        category: module.category,
        type: module.type,
        sponsor: module.sponsor,
        icon: module.icon,
        compatibility: module.compatibility,
        stats: module.stats,
        maintainers: module.maintainers,
        contributors: module.contributors,
        readme: module.readme,
        url: `https://nuxt.com/modules/${module.name}`
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
      }
    } catch (error: any) {
      return {
        content: [{ type: 'text' as const, text: error.statusMessage || 'Module not found' }],
        isError: true
      }
    }
  }
})
