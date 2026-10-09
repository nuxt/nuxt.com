import type { Node } from 'comark'
import type { BlogArticle } from '#shared/types'

/** Every blog post, with its parsed body. */
export async function listBlogDocuments() {
  const content = await getInstanceAtHead('site')
  const posts = (await listByDir<BlogArticle>('/blog')).filter(post => post.extension === '.md')
  return Promise.all(posts.map(async post => ({
    post,
    nodes: ((await content.get(post.path))?.nodes ?? []) as Node[]
  })))
}
