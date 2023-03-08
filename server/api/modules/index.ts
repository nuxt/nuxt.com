import { logger } from '@nuxt/kit'
import { useValidatedQuery, z, zh } from 'h3-zod'
import { performance } from 'node:perf_hooks'
// @ts-ignore
import ms from 'ms'

export default defineCachedEventHandler(async (event) => {
  const { version } = await useValidatedQuery(event, z.object({
    version: z.enum(['2', '3'])
  }))
  const start = performance.now()
  
  let modules = await fetchModules() as any[]
  // Filter out modules by compatibility
  modules = modules.filter(module => {
    return module.compatibility.nuxt.includes(`^${version}`)
  })

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

  // Remove empty modules
  logger.success(`Modules stats ready in ${ms(performance.now() - start)}`)

  return {
    version,
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
  getKey: (event) => getQuery(event)?.version as string,
  maxAge: 60 * 60, // 1 hour
})

