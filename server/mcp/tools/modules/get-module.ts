import { z } from 'zod'
import type { Module } from '#shared/types'

export default defineMcpTool({
  description: `Retrieves complete details about a specific Nuxt module including README, compatibility, supported providers, and stats.

WHEN TO USE: Use this tool when you know the EXACT module identifier. Common scenarios:
- User asks for a specific module: "Get details about @nuxt/ui"
- User mentions a known module: "Show me nuxt-icon module"
- You found a relevant module from list-modules and want full details
- You need to check Nuxt 4 compatibility for a specific module

WHEN NOT TO USE: If you don't know the exact module identifier and need to search/discover modules, use list-modules first.

PARAMETER: slug (required) - The module's slug (the "name" in list-modules, e.g. "ui", "i18n", "image") or its npm package name ("@nuxt/ui", "@nuxtjs/i18n"); both work.`,
  inputSchema: {
    slug: z.string().describe('Module slug ("ui", "i18n", "image") or npm package name ("@nuxt/ui", "@nuxtjs/i18n")')
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
    // The API knows slugs ("i18n"), but agents usually pass the npm name ("@nuxtjs/i18n")
    const name = (await fetchModules(useEvent()).catch(() => undefined) ?? []).find(module => module.npm === slug)?.name ?? slug
    let module: Module
    try {
      module = await $fetch<Module>(`https://api.nuxt.com/modules/${encodeURIComponent(name)}`)
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
      providers: module.providers?.map(({ name, label, category, docs }) => ({ name, label, category, docs })),
      stats: module.stats ? { downloads: module.stats.downloads, stars: module.stats.stars } : undefined,
      readme,
      url: `https://nuxt.com/modules/${module.name}`
    }
  }
})
