import { z } from 'zod'
import { satisfies } from 'semver'

export default defineCachedEventHandler(async (event) => {
  const { version, category } = await getValidatedQuery(event, z.object({
    version: z.enum(['2', '2-bridge', '3', 'all']).default('3'),
    category: z.string().optional()
  }).parse)
  console.log(`Fetching v${version} modules...${category ? ` for category: ${category}` : ''}`)

  let modules = await fetchModules(event) as any[]

  if (version !== 'all') {
    const major = (version === '2-bridge' ? '2' : version) satisfies '2' | '3'
    const testableVersion = `${major}.999.999`

    // Filter out modules by compatibility
    modules = modules.filter((module) => {
      // Nuxt 2 + bridge
      if (version === '2-bridge' && !module.compatibility.requires?.bridge) {
        return false
      }
      return satisfies(testableVersion, module.compatibility.nuxt)
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
        return module.categories.some((cat: string) => cat.toLowerCase() === lowerCaseCategory)
      }

      return false
    })
  }

  const maintainers: any = {}
  const contributors: any = {}
  for (const module of modules) {
    const [mStats, mContributors] = await Promise.all([
      fetchModuleStats(event, module),
      fetchModuleContributors(event, module)
    ])
    module.stats = mStats
    module.contributors = mContributors

    for (const maintainer of module.maintainers) {
      maintainers[maintainer.github] = maintainers[maintainer.github] || { ...maintainer, modules: [] }
      maintainers[maintainer.github].modules.push(module.name)
    }
    for (const contributor of module.contributors) {
      contributors[contributor.username] = contributors[contributor.username] || { ...contributor, modules: [] }
      contributors[contributor.username].modules.push(module.name)
      contributors[contributor.username].contributions += contributor.contributions || 0
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
    const query = getQuery(event)
    return `${query?.version || '3'}-${query?.category || 'all'}`
  },
  maxAge: 60 * 60 // 1 hour
})
