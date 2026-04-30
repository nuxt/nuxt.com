import { z } from 'zod'
import type { Module } from '#shared/types'

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
  annotations: {
    readOnlyHint: true,
    openWorldHint: true
  },
  inputExamples: [
    { slug: '@nuxt/ui' },
    { slug: '@nuxtjs/i18n' }
  ],
  cache: '1h',
  async handler({ slug }) {
    let module: Module
    try {
      module = await $fetch<Module>(`https://api.nuxt.com/modules/${encodeURIComponent(slug)}`)
    } catch (error: unknown) {
      const err = error as Error & { statusMessage?: string, statusCode?: number }
      throw createError({
        statusCode: err.statusCode ?? 404,
        message: err.statusMessage || `Module not found: ${slug}`
      })
    }

    let readme: string | undefined
    if (module.readme) {
      const raw = typeof module.readme === 'string'
        ? module.readme
        : JSON.stringify(module.readme)
      readme = raw.length > 8_000
        ? raw.slice(0, 8_000) + '… [README truncated]'
        : raw
    }

    return {
      name: module.name,
      description: module.description,
      npm: module.npm,
      repo: module.repo,
      website: module.website,
      learn_more: module.learn_more,
      category: module.category,
      type: module.type,
      compatibility: module.compatibility,
      stats: module.stats ? { downloads: module.stats.downloads, stars: module.stats.stars } : undefined,
      readme,
      url: `https://nuxt.com/modules/${module.name}`
    }
  }
})
