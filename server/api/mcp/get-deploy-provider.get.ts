import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

const querySchema = z.object({
  path: z.string().describe('The deploy provider path (e.g., /deploy/vercel)')
})

export default defineCachedEventHandler(async (event) => {
  const { path } = await getValidatedQuery(event, querySchema.parse)

  const provider = await queryCollection(event, 'deploy')
    .where('path', '=', path)
    .select('title', 'path', 'description', 'body', 'logoSrc', 'logoIcon', 'category', 'nitroPreset', 'website', 'sponsor')
    .first()

  if (!provider) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Deploy provider not found'
    })
  }

  return {
    title: provider.title,
    path: provider.path,
    description: provider.description,
    content: provider.body,
    logoSrc: provider.logoSrc,
    logoIcon: provider.logoIcon,
    category: provider.category,
    nitroPreset: provider.nitroPreset,
    website: provider.website,
    sponsor: provider.sponsor,
    url: `https://nuxt.com${provider.path}`
  }
}, {
  maxAge: 60 * 60, // 1 hour
  getKey: (event) => {
    const query = getQuery(event)
    return `mcp-deploy-provider-${query.path}`
  }
})
