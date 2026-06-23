import { queryCollection } from '@nuxt/content/server'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const { name } = await readValidatedBody(event, z.object({
    name: z.string().trim().min(1)
  }).parse)

  const needle = name.trim().toLowerCase()
  const providers = await queryCollection(event, 'deploy').all()
  const provider = providers.find(p =>
    p.path !== '/deploy'
    && (
      p.title?.toLowerCase() === needle
      || p.path?.toLowerCase().endsWith(`/${needle}`)
      || p.title?.toLowerCase().includes(needle)
    )
  )

  if (!provider) {
    return { error: `Hosting provider "${name}" not found` }
  }

  return {
    title: provider.title,
    description: provider.description,
    path: provider.path,
    logoSrc: provider.logoSrc,
    logoIcon: provider.logoIcon,
    category: provider.category,
    nitroPreset: provider.nitroPreset,
    website: provider.website
  }
})
