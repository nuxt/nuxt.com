import { defineCachedFunction } from 'nitropack/runtime'
import { hash } from 'ohash'
import type { H3Event } from 'h3'
import { z } from 'zod'
import type { Module, Stats } from '#shared/types'
import { resolveModuleCategory } from '#shared/utils/modules'

const inputSchema = z.object({
  search: z.string().optional().describe('Search term to filter modules by name, description, npm package name, or supported provider (e.g. "cloudinary" finds @nuxt/image)'),
  category: z.string().optional().describe('Filter by category name, case-insensitive (e.g., "Authentication", "UI Frameworks", "UI Components", "Backend & Database", "CMS & Content", "SEO"). Prefer search for keyword discovery.'),
  sort: z.enum(['downloads', 'stars', 'publishedAt', 'createdAt']).optional().default('downloads').describe('Sort modules by downloads, stars, published date, or created date'),
  order: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort order (ascending or descending)'),
  includeStats: z.boolean().optional().describe('Include full per-module stats. Defaults to true when sort is publishedAt or createdAt.')
})

const getResult = defineCachedFunction(async (event: H3Event, { search, category, sort = 'downloads', order = 'desc', includeStats }: z.output<typeof inputSchema>) => {
  const withStats = includeStats ?? (sort === 'publishedAt' || sort === 'createdAt')
  const response = await $fetch<{ modules: Module[], stats: Stats }>('https://api.nuxt.com/modules')

  let modules = response.modules || []

  if (category) {
    const lowerCaseCategory = resolveModuleCategory(category).toLowerCase()
    modules = modules.filter(module => module.category?.toLowerCase() === lowerCaseCategory)
  }

  const searchLower = search?.toLowerCase()
  const matchedProviders = (module: Module) => {
    if (!searchLower) return
    const labels = module.providers?.filter(provider => provider.label.toLowerCase().includes(searchLower)).map(provider => provider.label)
    return labels?.length ? labels : undefined
  }

  if (searchLower) {
    modules = modules.filter(module =>
      module.name.toLowerCase().includes(searchLower)
      || module.description?.toLowerCase().includes(searchLower)
      || module.npm.toLowerCase().includes(searchLower)
      || !!matchedProviders(module)
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
        // Providers that matched the search, e.g. "Cloudinary" for @nuxt/image
        matchedProviders: matchedProviders(module),
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
}, {
  name: 'mcp-list-modules',
  maxAge: 3600,
  swr: false,
  getKey: (event, args) => hash([getRequestURL(event).origin, args])
})

export default defineMcpTool({
  description: `Lists all available Nuxt modules with optional filtering and sorting capabilities.

WHEN TO USE: Use this tool when you need to DISCOVER or SEARCH for modules. Common scenarios:
- "I need an authentication module" - search by category or keyword
- "What UI libraries are available?" - filter by category
- "Show me popular image optimization modules" - filter + sort by downloads
- "Find a module for X feature" - general exploration

PARAMETERS:
- search: Filter by name, description, npm package name, or supported provider (e.g. "cloudinary", "plausible")
- category: Filter by category name, case-insensitive (e.g., "Authentication", "UI Frameworks", "Backend & Database", "CMS & Content", "SEO") — use search for keyword discovery, not category
- sort: Order by downloads, stars, publishedAt, or createdAt
- order: asc or desc
- includeStats: Include full per-module stats (downloads, stars, publishedAt, createdAt, etc.). Defaults to true when sort is publishedAt or createdAt.

WHEN NOT TO USE: If you already know the exact module slug (e.g., "@nuxt/ui"), use get-module directly.

OUTPUT: Returns list of modules with name, description, category, and either downloads/stars or full stats. When the search matched a module's providers, matchedProviders lists them. Use get-module for complete details including README and compatibility.`,
  inputSchema: inputSchema.meta({ examples: [
    { search: 'auth' },
    { category: 'UI Frameworks', sort: 'downloads' },
    { search: 'image', sort: 'stars', order: 'desc' },
    { search: 'plausible' }
  ] satisfies z.input<typeof inputSchema>[] }),
  annotations: {
    readOnlyHint: true,
    openWorldHint: true
  },
  handler: args => getResult(useEvent(), args)
})
