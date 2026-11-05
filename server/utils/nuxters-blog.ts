import type { BlogArticle, NuxterBlogPost } from '#shared/types'
import { isBlogPostBy } from '#shared/utils/blog'

/** The blog posts a Nuxter wrote, newest first. Posts are a bonus on a profile: an error returns none. */
export async function nuxterBlogPosts(username: string): Promise<NuxterBlogPost[]> {
  const posts = await listByDir<BlogArticle>('/blog').catch((error) => {
    console.error('[nuxters] Cannot list the blog posts:', error)
    return []
  })
  return posts
    .filter(post => post.extension === '.md' && !post.draft && isBlogPostBy(post.authors, username))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .map(({ title, description, path, date, image, category }) => ({ title, description, path, date, image, category }))
}
