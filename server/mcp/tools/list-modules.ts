import { z } from 'zod'
import type { Module, Stats } from '~/types'

export default defineMcpTool({
  description: `Lists all available Nuxt modules with optional filtering and sorting capabilities.

WHEN TO USE: Use this tool when you need to DISCOVER or SEARCH for modules. Common scenarios:
- "I need an authentication module" - search by category or keyword
- "What UI libraries are available?" - filter by category
- "Show me popular image optimization modules" - filter + sort by downloads
- "Find a module for X feature" - general exploration

PARAMETERS:
- search: Filter by name, description, or npm package name
- category: Filter by category (e.g., "ui", "auth", "database", "media", "seo")
- sort: Order by downloads, stars, publishedAt, or createdAt
- order: asc or desc

WHEN NOT TO USE: If you already know the exact module slug (e.g., "@nuxt/ui"), use get_module directly.

OUTPUT: Returns list of modules with name, description, category, stats. Use get_module for complete details including README and compatibility.`,
  inputSchema: {
    search: z.string().optional().describe('Search term to filter modules by name, description, or npm package name'),
    category: z.string().optional().describe('Filter modules by category (e.g., "ui", "database", "auth", "seo")'),
    sort: z.enum(['downloads', 'stars', 'publishedAt', 'createdAt']).optional().default('downloads').describe('Sort modules by downloads, stars, published date, or created date'),
    order: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort order (ascending or descending)')
  },
  cache: '1h',
  async handler({ search, category, sort = 'downloads', order = 'desc' }) {
    const response = await $fetch<{ modules: Module[], stats: Stats }>('https://api.nuxt.com/modules')

    let modules = response.modules || []

    // Filter by category if provided
    if (category) {
      modules = modules.filter(module => module.category === category)
    }

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase()
      modules = modules.filter(module =>
        module.name.toLowerCase().includes(searchLower)
        || module.description.toLowerCase().includes(searchLower)
        || module.npm.toLowerCase().includes(searchLower)
      )
    }

    // Sort modules
    modules.sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      switch (sort) {
        case 'downloads':
          aValue = a.stats.downloads
          bValue = b.stats.downloads
          break
        case 'stars':
          aValue = a.stats.stars
          bValue = b.stats.stars
          break
        case 'publishedAt':
          aValue = a.stats.publishedAt
          bValue = b.stats.publishedAt
          break
        case 'createdAt':
          aValue = a.stats.createdAt
          bValue = b.stats.createdAt
          break
        default:
          aValue = a.stats.downloads
          bValue = b.stats.downloads
      }

      if (order === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

    const result = {
      modules: modules.map(module => ({
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
        url: `https://nuxt.com/modules/${module.name}`
      })),
      stats: response.stats,
      total: modules.length
    }

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
    }
  }
})
