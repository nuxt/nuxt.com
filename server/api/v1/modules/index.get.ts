import { z } from 'zod'
import { CURRENT_NUXT_VERSION, filterModulesByNuxtVersions, MODULE_VERSION_VALUES } from '#shared/utils/modules'

export default defineCachedEventHandler(async (event) => {
  const { versions, category } = await getValidatedQuery(event, (query) => {
    const { version, category } = z.object({
      version: z.union([z.string(), z.array(z.string())]).optional(),
      category: z.string().optional()
    }).parse(query)

    return {
      versions: z.array(z.enum(MODULE_VERSION_VALUES)).min(1).parse(
        (Array.isArray(version) ? version : [version || CURRENT_NUXT_VERSION])
          .flatMap(value => value.split(','))
      ),
      category
    }
  })
  console.log(`Fetching v${versions.join(',')} modules...${category ? ` for category: ${category}` : ''}`)

  let modules = await fetchModules(event) || []

  modules = filterModulesByNuxtVersions(modules, versions)

  // Filter by category if provided
  if (category) {
    const lowerCaseCategory = category.toLowerCase()
    modules = modules.filter((module) => {
      if (module.category && module.category.toLowerCase() === lowerCaseCategory) {
        return true
      }

      if (module.categories && Array.isArray(module.categories)) {
        return module.categories.some(cat => cat.toLowerCase() === lowerCaseCategory)
      }

      return false
    })
  }

  interface MaintainerWithModules {
    name: string
    github: string
    twitter?: string
    bluesky?: string
    modules: string[]
  }

  interface ContributorWithModules {
    id: number
    username: string
    contributions: number
    modules: string[]
  }

  // Health is served separately (/api/v1/modules/health) so nuxt.care latency
  // can't block or poison this list's SWR cache.
  const bulkNpmStats = await npm.fetchBulkPackageStats(modules.map(m => m.npm), 'last-month')

  const maintainers: Record<string, MaintainerWithModules> = {}
  const contributors: Record<string, ContributorWithModules> = {}
  for (const module of modules) {
    const [mStats, mContributors] = await Promise.all([
      fetchModuleStats(event, module, bulkNpmStats[module.npm]),
      fetchModuleContributors(event, module)
    ])
    module.stats = mStats
    module.contributors = mContributors

    if (module.maintainers) {
      for (const maintainer of module.maintainers) {
        maintainers[maintainer.github] ||= { ...maintainer, modules: [] }
        maintainers[maintainer.github]!.modules.push(module.name)
      }
    }
    if (module.contributors) {
      for (const contributor of module.contributors) {
        contributors[contributor.username] ||= { id: contributor.id, username: contributor.username, contributions: 0, modules: [] }
        contributors[contributor.username]!.modules.push(module.name)
        contributors[contributor.username]!.contributions += contributor.contributions || 0
      }
    }
  }

  return {
    version: versions.join(','),
    versions,
    category: category || null,
    generatedAt: new Date().toISOString(),
    stats: {
      downloads: modules.reduce((acc, module) => acc + (module.stats?.downloads || 0), 0),
      stars: modules.reduce((acc, module) => acc + (module.stats?.stars || 0), 0),
      maintainers: Object.keys(maintainers).length,
      contributors: Object.keys(contributors).length,
      modules: modules.length
    },
    maintainers: Object.values(maintainers).sort((a, b) => b.modules.length - a.modules.length),
    contributors: Object.values(contributors).sort((a, b) => b.modules.length - a.modules.length),
    modules
  }
}, {
  name: 'modules',
  swr: true,
  getKey(event) {
    const query = getQuery(event)
    const version = Array.isArray(query.version) ? query.version.join(',') : query.version
    return `${version || CURRENT_NUXT_VERSION}-${query.category || 'all'}`
  },
  maxAge: 60 * 60 // 1 hour
})
