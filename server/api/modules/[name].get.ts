import { z } from 'zod'

export default defineCachedEventHandler(async (event) => {
  const { name } = await getValidatedRouterParams(event, z.object({
    name: z.string()
  }).parse)

  const modules = await fetchModules(event) as any[]

  const module = modules.find(module => module.name === name)
  if (!module) {
    throw createError({
      statusCode: 404,
      message: `Module ${name} not found`
    })
  }

  const [stats, contributors, readme] = await Promise.all([
    fetchModuleStats(event, module),
    fetchModuleContributors(event, module),
    fetchModuleReadme(event, module, true)
  ])
  module.generatedAt = new Date().toISOString()
  module.stats = stats
  module.contributors = contributors
  module.readme = readme

  return module
}, {
  name: 'modules',
  getKey: event => event.context.params?.name as string,
  maxAge: 60 * 60 // 1 hour
})
