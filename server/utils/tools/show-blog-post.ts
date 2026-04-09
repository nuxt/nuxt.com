import { tool } from 'ai'
import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'
import type { H3Event } from 'h3'

export function createShowBlogPostTool(event: H3Event) {
  return tool({
    description: 'Display a rich blog post card with image, title, date, and author. Use when the user asks about Nuxt blog posts, release announcements, tutorials, or when referencing a specific blog article.',
    inputSchema: z.object({
      title: z.string().describe('The blog post title or search keyword (e.g., "v4", "Nuxt 3.15", "TypeScript")')
    }),
    execute: async ({ title }) => {
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
    }
  })
}
