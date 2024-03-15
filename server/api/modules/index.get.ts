import { z } from 'zod'

export default defineCachedEventHandler(async (event) => {
  const { version } = await getValidatedQuery(event, z.object({
    version: z.enum(['2', '2-bridge', '3', 'all']).default('3')
  }).parse)
  console.log(`Fetching v${version} modules...`)
  
  let modules = await fetchModules() as any[]

  if (version !== 'all') {
    // Filter out modules by compatibility
    modules = modules.filter(module => {
      // Nuxt 2 + bridge
      if (version === '2-bridge') {
        return module.compatibility.nuxt.includes(`^2`) && module.compatibility.requires?.bridge
      }
      return module.compatibility.nuxt.includes(`^${version}`)
    })
  }

  const maintainers: any = {}
  const contributors: any = {}
  for (const module of modules) {
    const [mStats, mContributors] = await Promise.all([
      fetchModuleStats(module),
      fetchModuleContributors(module)
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
    modules,
  }
}, {
  name: 'modules',
  swr: true,
  getKey (event) {
    return (getQuery(event)?.version || '3') as string
  },
  maxAge: 60 * 60, // 1 hour
})

