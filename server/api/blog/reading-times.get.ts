import type { Node } from 'comark'
import type { BlogArticle } from '#shared/types'
import { readingMinutes } from '#shared/utils/reading-time'

/** Minutes to read each blog post, keyed by path. */
export default defineCachedEventHandler(async () => {
  const content = await getInstanceAtHead('site')
  const posts = (await listByDir<BlogArticle>('/blog')).filter(post => post.extension === '.md')
  const entries = await Promise.all(posts.map(async post =>
    [post.path, readingMinutes((await content.get(post.path))?.nodes as Node[] | undefined)] as const
  ))
  return Object.fromEntries(entries) as Record<string, number>
}, {
  name: 'blog-reading-times',
  getKey: () => resolveInstanceSha('site'),
  swr: true,
  maxAge: 60 * 60
})
