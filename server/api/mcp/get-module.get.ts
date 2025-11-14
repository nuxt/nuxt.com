import { z } from 'zod'
import type { Module } from '~/types'

const querySchema = z.object({
  slug: z.string().describe('The module slug/name (e.g., "@nuxt/ui", "nuxt-auth", "nuxt-icon")')
})

export default defineCachedEventHandler(async (event) => {
  const { slug } = await getValidatedQuery(event, querySchema.parse)

  try {
    const module = await $fetch<Module>(`https://api.nuxt.com/modules/${slug}`)

    return {
      name: module.name,
      description: module.description,
      npm: module.npm,
      repo: module.repo,
      github: module.github,
      website: module.website,
      learn_more: module.learn_more,
      category: module.category,
      type: module.type,
      sponsor: module.sponsor,
      icon: module.icon,
      compatibility: module.compatibility,
      stats: module.stats,
      maintainers: module.maintainers,
      contributors: module.contributors,
      readme: module.readme,
      url: `https://nuxt.com/modules/${module.name}`
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 404,
      statusMessage: error.statusMessage || 'Module not found'
    })
  }
}, {
  maxAge: 60 * 60, // 1 hour
  getKey: (event) => {
    const query = getQuery(event)
    return `mcp-module-${query.slug}`
  }
})
