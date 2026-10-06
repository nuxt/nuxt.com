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
    const posts = (await listByDir('/blog'))
      .filter(p => p.extension === '.md')
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))

    const post = posts.find(p =>
      p.path !== '/blog'
      && (
        p.title?.toLowerCase().includes(body.title.toLowerCase())
        || p.path?.toLowerCase().includes(body.title.toLowerCase())
      )
    )

    if (!post) {
      return { error: `Blog post matching "${body.title}" not found` }
    }

    return {
      title: post.title,
      description: post.description,
      path: post.path,
      date: post.date,
      image: post.image,
      category: post.category,
      authors: (post.authors as Array<{ name: string, avatar?: { src?: string } }>)?.map(a => ({
        name: a.name,
        avatar: a.avatar?.src
      }))
    }
  }

  if (body.kind === 'deploy') {
    const needle = body.name.trim().toLowerCase()
    const providers = await listByDir('/deploy')
    const provider = providers.find(p =>
      p.path !== '/deploy'
      && (
        p.title?.toLowerCase() === needle
        || p.path?.toLowerCase().endsWith(`/${needle}`)
        || p.title?.toLowerCase().includes(needle)
      )
    )

    if (!provider) {
      return { error: `Hosting provider "${body.name}" not found` }
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
  }

  const allTemplates = await listByDir('/templates')

  const results = body.names.map((rawName) => {
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
    return { error: `No templates found matching: ${body.names.join(', ')}` }
  }

  return { templates: results }
})
