import { z } from 'zod'
import { satisfies } from 'semver'

export default defineCachedEventHandler(async (event) => {
  const { version } = await getValidatedQuery(event, z.object({
    version: z.enum(['2', '2-bridge', '3', 'all']).default('3')
  }).parse)

  let modules = await fetchModules(event) as any[]

  if (version !== 'all') {
    const major = (version === '2-bridge' ? '2' : version) satisfies '2' | '3'
    const testableVersion = `${major}.999.999`

    // Filter modules by compatibility
    modules = modules.filter((module) => {
      if (version === '2-bridge' && !module.compatibility.requires?.bridge) {
        return false
      }
      return satisfies(testableVersion, module.compatibility.nuxt)
    })
  }

  // Extract unique categories
  const categories = new Set<string>()

  modules.forEach((module) => {
    if (module.category) categories.add(module.category)
    if (module.categories?.length) module.categories.forEach((cat: string) => categories.add(cat))
  })

  return {
    version,
    generatedAt: new Date().toISOString(),
    categories: Array.from(categories).sort((a, b) => a.localeCompare(b))
  }
}, {
  name: 'module-categories',
  swr: true,
  getKey: event => (getQuery(event)?.version || '3') as string,
  maxAge: 60 * 60 // 1 hour
})
