import { z } from 'zod'
import { queryCollection } from '@nuxt/content/nitro'

const querySchema = z.object({
  path: z.string().describe('The deploy provider path (e.g., /deploy/vercel)')
})

export default defineEventHandler(async (event) => {
  const { path } = await getValidatedQuery(event, querySchema.parse)

  try {
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
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch deploy provider'
    })
  }
})
