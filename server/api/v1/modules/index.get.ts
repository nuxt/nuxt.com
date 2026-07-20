import { moduleSupportsNuxt } from '#shared/utils/modules'
import { modulesCacheKey, normalizeModulesQuery } from '#shared/utils/modules-query'

export default defineCachedEventHandler(async (event) => {
  const { version, category } = normalizeModulesQuery(getQuery(event) as Record<string, unknown>)
  console.log(`Fetching v${version} modules...${category ? ` for category: ${category}` : ''}`)

  let modules = await fetchModules(event) || []

  if (version !== 'all') {
    const major = (version === '2-bridge' ? 2 : Number(version)) as 2 | 3 | 4

    // Filter out modules by compatibility
    modules = modules.filter((module) => {
      // Nuxt 2 + bridge
      if (version === '2-bridge' && !module.compatibility.requires?.bridge) {
        return false
      }
      return moduleSupportsNuxt(module.compatibility.nuxt, major)
    })
  }

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
    version,
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
    return modulesCacheKey(getQuery(event) as Record<string, unknown>)
  },
  maxAge: 60 * 60 // 1 hour
})
