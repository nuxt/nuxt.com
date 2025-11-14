import { z } from 'zod'
import type { Module, Stats } from '~/types'

const querySchema = z.object({
  search: z.string().optional().describe('Search term to filter modules by name, description, or npm package name'),
  category: z.string().optional().describe('Filter modules by category (e.g., "ui", "database", "auth", "seo")'),
  sort: z.enum(['downloads', 'stars', 'publishedAt', 'createdAt']).optional().default('downloads').describe('Sort modules by downloads, stars, published date, or created date'),
  order: z.enum(['asc', 'desc']).optional().default('desc').describe('Sort order (ascending or descending)')
})

export default defineCachedEventHandler(async (event) => {
  const { category, search, sort = 'downloads', order = 'desc' } = await getValidatedQuery(event, querySchema.parse)

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

  return {
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
}, {
  maxAge: 60 * 60, // 1 hour
  getKey: (event) => {
    const query = getQuery(event)
    return `mcp-modules-${query.category || 'all'}-${query.search || ''}-${query.sort || 'downloads'}-${query.order || 'desc'}`
  }
})
