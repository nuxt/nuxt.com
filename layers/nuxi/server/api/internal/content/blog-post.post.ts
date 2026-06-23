import { queryCollection } from '@nuxt/content/server'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  requireInternalRequest(event)

  const { title } = await readValidatedBody(event, z.object({
    title: z.string()
  }).parse)

  const posts = await queryCollection(event, 'blog')
    .where('extension', '=', 'md')
    .order('date', 'DESC')
    .all()

  const post = posts.find(p =>
    p.path !== '/blog'
    && (
      p.title?.toLowerCase().includes(title.toLowerCase())
      || p.path?.toLowerCase().includes(title.toLowerCase())
    )
  )

  if (!post) {
    return { error: `Blog post matching "${title}" not found` }
  }

  return {
    title: post.title,
    description: post.description,
    path: post.path,
    date: post.date,
    image: post.image,
    category: post.category,
    authors: post.authors?.map(a => ({
      name: a.name,
      avatar: a.avatar?.src
    }))
  }
})
