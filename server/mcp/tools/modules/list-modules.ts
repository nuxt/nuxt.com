import { z } from 'zod'
import type { Module, Stats } from '#shared/types'
import { getModuleNuxtMajors, moduleSupportsNuxt } from '#shared/utils/modules'

export default defineMcpTool({
  description: `Lists all available Nuxt modules with optional filtering and sorting capabilities.

WHEN TO USE: Use this tool when you need to DISCOVER or SEARCH for modules. Common scenarios:
- "I need an authentication module" - search by category or keyword
- "What UI libraries are available?" - filter by category
- "Show me popular image optimization modules" - filter + sort by downloads
- "Find a module for X feature" - general exploration
- "Modules compatible with Nuxt 4" - set version to "4"

PARAMETERS:
- search: Filter by name, description, or npm package name
- category: Filter by exact category name (e.g., "Security", "UI", "Database", "CMS", "SEO") — use search for keyword discovery, not category
- version: Filter by declared Nuxt major via compatibility.nuxt ("3", "4", or "all"). Default "3" matches the modules catalog on nuxt.com.
- sort: Order by downloads, stars, publishedAt, or createdAt
- order: asc or desc
- includeStats: Include full per-module stats (downloads, stars, publishedAt, createdAt, etc.). Defaults to true when sort is publishedAt or createdAt.

WHEN NOT TO USE: If you already know the exact module slug (e.g., "@nuxt/ui"), use get_module directly.

OUTPUT: Returns list of modules with name, description, category, nuxtMajors (3 and/or 4 from compatibility.nuxt), and either downloads/stars or full stats. Use get_module for complete details including README and compatibility.`,
  inputSchema: {
    search: z.string().optional().describe('Search term to filter modules by name, description, or npm package name'),
    category: z.string().optional().describe('Filter by exact category name (e.g., "Security", "UI", "Database", "CMS", "SEO"). Auth modules use category "Security", not "auth". Prefer search for keyword discovery.'),
    version: z.enum(['3', '4', 'all']).optional().default('3').describe('Filter by Nuxt major declared in compatibility.nuxt. Use "all" to skip major filtering.'),
    sort: z.enum(['downloads', 'stars', 'publishedAt', 'createdAt']).optional().default('downloads').describe('Sort modules by downloads, stars, published date, or created date'),
    order: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort order (ascending or descending)'),
    includeStats: z.boolean().optional().describe('Include full per-module stats. Defaults to true when sort is publishedAt or createdAt.')
  },
  annotations: {
    readOnlyHint: true,
    openWorldHint: true
  },
  inputExamples: [
    { search: 'auth' },
    { category: 'ui', sort: 'downloads' },
    { search: 'image', sort: 'stars', order: 'desc' },
    { version: '4', category: 'UI' }
  ],
  cache: {
    maxAge: '1h',
    getKey: (args: { search?: string, category?: string, version?: string, sort?: string, order?: string, includeStats?: boolean }) =>
      `search=${args.search ?? ''}|category=${args.category ?? ''}|version=${args.version ?? '3'}|sort=${args.sort ?? 'downloads'}|order=${args.order ?? 'desc'}|stats=${args.includeStats ?? (args.sort === 'publishedAt' || args.sort === 'createdAt')}`
  },
  async handler({ search, category, version = '3', sort = 'downloads', order = 'desc', includeStats }) {
    const withStats = includeStats ?? (sort === 'publishedAt' || sort === 'createdAt')
    const response = await $fetch<{ modules: Module[], stats: Stats }>('https://api.nuxt.com/modules')

    let modules = response.modules || []

    if (version !== 'all') {
      const major = Number(version) as 3 | 4
      modules = modules.filter(module => moduleSupportsNuxt(module.compatibility?.nuxt, major))
    }

    if (category) {
      modules = modules.filter(module => module.category === category)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      modules = modules.filter(module =>
        module.name.toLowerCase().includes(searchLower)
        || module.description?.toLowerCase().includes(searchLower)
        || module.npm.toLowerCase().includes(searchLower)
      )
    }

    modules.sort((a, b) => {
      const aStats = a.stats
      const bStats = b.stats

      if (!aStats && !bStats) return 0
      if (!aStats) return 1
      if (!bStats) return -1

      let aValue: number
      let bValue: number

      switch (sort) {
        case 'downloads':
          aValue = aStats.downloads
          bValue = bStats.downloads
          break
        case 'stars':
          aValue = aStats.stars
          bValue = bStats.stars
          break
        case 'publishedAt':
          aValue = aStats.publishedAt
          bValue = bStats.publishedAt
          break
        case 'createdAt':
          aValue = aStats.createdAt
          bValue = bStats.createdAt
          break
        default:
          aValue = aStats.downloads
          bValue = bStats.downloads
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

    const totalMatches = modules.length

    return {
      modules: modules.slice(0, 20).map((module) => {
        const base = {
          name: module.name,
          description: module.description,
          npm: module.npm,
          icon: module.icon,
          repo: module.repo,
          github: module.github,
          website: module.website,
          learn_more: module.learn_more,
          category: module.category,
          nuxtMajors: getModuleNuxtMajors(module.compatibility?.nuxt),
          url: `https://nuxt.com/modules/${module.name}`
        }

        if (withStats && module.stats) {
          return { ...base, stats: module.stats }
        }

        return {
          ...base,
          downloads: module.stats?.downloads,
          stars: module.stats?.stars
        }
      }),
      stats: response.stats,
      total: totalMatches
    }
  }
})
