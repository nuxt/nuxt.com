import { logger } from '@nuxt/kit'
import { useValidatedParams, z, zh } from 'h3-zod'
// @ts-ignore
import ms from 'ms'

export default defineCachedEventHandler(async (event) => {
  const params = await useValidatedParams(event, z.object({
    version: zh.intAsString
  }))
  const start = performance.now()
  logger.info(`Fetching modules v${params.version} from CDN...`)
  let modules: any[] = await $fetch('https://unpkg.com/@nuxt/modules@latest/modules.json')

  // Filter out modules by compatibility
  modules = modules.filter(module => {
    return module.compatibility.nuxt.includes(`^${params.version}`)
  })

  const maintainers: any = {}
  const contributors: any = {}
  for (const module of modules) {
    const [mStats, mContributors] = await Promise.all([
      fetchModuleStats(module).catch((err) => ({})),
      fetchModuleContributors(module).catch((err) => [])
    ])
    module.stats = mStats
    module.contributors = mContributors

    for (const maintainer of module.maintainers) {
      maintainers[maintainer.github] = maintainers[maintainer.github] || { ...maintainer, modules: [] }
      maintainers[maintainer.github].modules.push(module.name)
    }
    for (const contributor of module.contributors) {
      if (contributor.username.includes('[bot]') || contributor.username.includes('-bot')) continue
      contributors[contributor.username] = contributors[contributor.username] || { ...contributor, modules: [] }
      contributors[contributor.username].modules.push(module.name)
      contributors[contributor.username].contributions += contributor.contributions || 0
    }
  }

  // Remove empty modules
  logger.success(`Modules stats ready in ${ms(performance.now() - start)}`)

  return {
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
  getKey: (event) => event.context.params?.version || '3',
  maxAge: 60 * 60, // 1 hour
})

