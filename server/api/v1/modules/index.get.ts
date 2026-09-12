import { z } from 'zod'

export default defineCachedEventHandler(async (event) => {
  const { version, category } = await getValidatedQuery(
    event,
    z.object({
      version: z.enum(['2', '2-bridge', '3', '4', 'all']).optional(),
      category: z.string().optional()
    }).parse
  )

  console.log(`Fetching ${version ? `v${version}` : 'non-legacy'} modules...${category ? ` for category: ${category}` : ''}`)

  const fetchedModules = await fetchModules(event) || []

  // Filter modules by version compatibility defaults to non-legacy versions (3 and 4)
  const compatibilityFilteredModules = filterModulesByCompatibility(fetchedModules, version)

  // Filter modules by category if provided
  const modules = filterModulesByCategory(compatibilityFilteredModules, category)

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
    version: version || 'non-legacy',
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
    return `${query?.version || 'non-legacy'}-${query?.category || 'all'}`
  },
  maxAge: 60 * 60 // 1 hour
})
