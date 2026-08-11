import { z } from 'zod'

const blogBodySchema = z.object({
  kind: z.literal('blog'),
  title: z.string()
})

const deployBodySchema = z.object({
  kind: z.literal('deploy'),
  name: z.string().trim().min(1)
})

const templatesBodySchema = z.object({
  kind: z.literal('templates'),
  names: z.array(z.string().trim().min(1)).min(1)
})

export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const body = await readValidatedBody(event, z.discriminatedUnion('kind', [
    blogBodySchema,
    deployBodySchema,
    templatesBodySchema
  ]).parse)

  if (body.kind === 'blog') {
    const items = await content.list(['local'])
    const posts = items
      .filter(item => item.path.startsWith('/blog/') && item.path !== '/blog' && item.meta.extension === '.md')
      .sort((a, b) => (b.data.date || '').localeCompare(a.data.date || ''))

    const post = posts.find(p =>
      p.data.title?.toLowerCase().includes(body.title.toLowerCase())
      || p.path.toLowerCase().includes(body.title.toLowerCase())
    )

    if (!post) {
      return { error: `Blog post matching "${body.title}" not found` }
    }

    return {
      title: post.data.title,
      description: post.data.description,
      path: post.path,
      date: post.data.date,
      image: post.data.image,
      category: post.data.category,
      authors: post.data.authors?.map(a => ({
        name: a.name,
        avatar: a.avatar?.src
      }))
    }
  }

  if (body.kind === 'deploy') {
    const needle = body.name.trim().toLowerCase()
    const items = await content.list(['local'])
    const providers = items.filter(item => item.path.startsWith('/deploy/') && item.path !== '/deploy')

    const provider = providers.find(p =>
      p.data.title?.toLowerCase() === needle
      || p.path.toLowerCase().endsWith(`/${needle}`)
      || p.data.title?.toLowerCase().includes(needle)
    )

    if (!provider) {
      return { error: `Hosting provider "${body.name}" not found` }
    }

    return {
      title: provider.data.title,
      description: provider.data.description,
      path: provider.path,
      logoSrc: provider.data.logoSrc,
      logoIcon: provider.data.logoIcon,
      category: provider.data.category,
      nitroPreset: provider.data.nitroPreset,
      website: provider.data.website
    }
  }

  const items = await content.list(['local'])
  const allTemplates = items.filter(item => item.path.startsWith('/templates/'))

  const results = body.names.map((rawName) => {
    const name = rawName.trim().toLowerCase()
    const template = allTemplates.find(t =>
      t.data.slug?.toLowerCase() === name
      || t.data.name?.toLowerCase() === name
      || t.data.slug?.toLowerCase().includes(name)
      || t.data.name?.toLowerCase().includes(name)
    )

    if (!template) return null

    return {
      name: template.data.name,
      slug: template.data.slug,
      description: template.data.description,
      repo: template.data.repo,
      demo: template.data.demo,
      badge: template.data.badge,
      purchase: template.data.purchase
    }
  }).filter(Boolean)

  if (!results.length) {
    return { error: `No templates found matching: ${body.names.join(', ')}` }
  }

  return { templates: results }
})
