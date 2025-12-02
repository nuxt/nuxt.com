import { z } from 'zod'
import type { Module } from '#shared/types'

export default defineCachedEventHandler(async (event) => {
  const { name } = await getValidatedRouterParams(event, z.object({
    name: z.string()
  }).parse)

  const modules = await fetchModules(event)

  const module = modules?.find(module => module.name === name)
  if (!module) {
    throw createError({
      statusCode: 404,
      message: `Module ${name} not found`
    })
  }

  const [stats, contributors, readme] = await Promise.all([
    fetchModuleStats(event, module),
    fetchModuleContributors(event, module),
    fetchModuleReadme(event, module)
  ])
  return {
    ...module,
    generatedAt: new Date().toISOString(),
    contributors,
    stats,
    readme
  } satisfies Module
}, {
  name: 'modules',
  getKey: event => event.context.params?.name as string,
  maxAge: 60 * 60 // 1 hour
})
