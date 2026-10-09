import { readingMinutes } from '#shared/utils/reading-time'

/** Minutes to read each blog post, keyed by path. */
export default defineCachedEventHandler(async () => {
  const documents = await listBlogDocuments()
  return Object.fromEntries(documents.map(({ post, nodes }) => [post.path, readingMinutes(nodes)])) as Record<string, number>
}, {
  name: 'blog-reading-times',
  getKey: () => resolveInstanceSha('site'),
  swr: true,
  maxAge: 60 * 60
})
