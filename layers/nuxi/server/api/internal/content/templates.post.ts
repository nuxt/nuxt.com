import { queryCollection } from '@nuxt/content/server'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const { names } = await readValidatedBody(event, z.object({
    names: z.array(z.string().trim().min(1)).min(1)
  }).parse)

  const allTemplates = await queryCollection(event, 'templates').all()

  const results = names.map((rawName) => {
    const name = rawName.trim().toLowerCase()
    const template = allTemplates.find(t =>
      t.slug.toLowerCase() === name
      || t.name.toLowerCase() === name
      || t.slug.toLowerCase().includes(name)
      || t.name.toLowerCase().includes(name)
    )

    if (!template) return null

    return {
      name: template.name,
      slug: template.slug,
      description: template.description,
      repo: template.repo,
      demo: template.demo,
      badge: template.badge,
      purchase: template.purchase
    }
  }).filter(Boolean)

  if (!results.length) {
    return { error: `No templates found matching: ${names.join(', ')}` }
  }

  return { templates: results }
})
