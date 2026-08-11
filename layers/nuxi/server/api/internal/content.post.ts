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
      .sort((a, b) => {
        const dateA = (a.data as { date?: string }).date || ''
        const dateB = (b.data as { date?: string }).date || ''
        return dateB.localeCompare(dateA)
      })

    const post = posts.find((p) => {
      const data = p.data as { title?: string }
      return (
        data.title?.toLowerCase().includes(body.title.toLowerCase())
        || p.path.toLowerCase().includes(body.title.toLowerCase())
      )
    })

    if (!post) {
      return { error: `Blog post matching "${body.title}" not found` }
    }

    const data = post.data as Record<string, any>
    return {
      title: data.title,
      description: data.description,
      path: post.path,
      date: data.date,
      image: data.image,
      category: data.category,
      authors: data.authors?.map((a: { name: string, avatar?: { src?: string } }) => ({
        name: a.name,
        avatar: a.avatar?.src
      }))
    }
  }

  if (body.kind === 'deploy') {
    const needle = body.name.trim().toLowerCase()
    const items = await content.list(['local'])
    const providers = items.filter(item => item.path.startsWith('/deploy/') && item.path !== '/deploy')

    const provider = providers.find((p) => {
      const data = p.data as { title?: string }
      return (
        data.title?.toLowerCase() === needle
        || p.path.toLowerCase().endsWith(`/${needle}`)
        || data.title?.toLowerCase().includes(needle)
      )
    })

    if (!provider) {
      return { error: `Hosting provider "${body.name}" not found` }
    }

    const data = provider.data as Record<string, any>
    return {
      title: data.title,
      description: data.description,
      path: provider.path,
      logoSrc: data.logoSrc,
      logoIcon: data.logoIcon,
      category: data.category,
      nitroPreset: data.nitroPreset,
      website: data.website
    }
  }

  const items = await content.list(['local'])
  const allTemplates = items.filter(item => item.path.startsWith('/templates/'))

  const results = body.names.map((rawName) => {
    const name = rawName.trim().toLowerCase()
    const template = allTemplates.find((t) => {
      const data = t.data as { slug?: string, name?: string }
      return (
        data.slug?.toLowerCase() === name
        || data.name?.toLowerCase() === name
        || data.slug?.toLowerCase().includes(name)
        || data.name?.toLowerCase().includes(name)
      )
    })

    if (!template) return null

    const data = template.data as Record<string, any>
    return {
      name: data.name,
      slug: data.slug,
      description: data.description,
      repo: data.repo,
      demo: data.demo,
      badge: data.badge,
      purchase: data.purchase
    }
  }).filter(Boolean)

  if (!results.length) {
    return { error: `No templates found matching: ${body.names.join(', ')}` }
  }

  return { templates: results }
})
