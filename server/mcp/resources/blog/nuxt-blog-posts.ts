import { queryCollection } from '@nuxt/content/server'

export default defineMcpResource({
  uri: 'resource://nuxt-com/blog-posts',
  description: 'Complete list of Nuxt blog posts including releases, tutorials, and announcements',
  cache: '1h',
  async handler(uri: URL) {
    const event = useEvent()

    const blogPosts = await queryCollection(event, 'blog')
      .select('title', 'path', 'description', 'date', 'category', 'tags', 'authors', 'image')
      .all()

    if (!blogPosts) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Blog posts collection not found' })
        }]
      }
    }

    const result = blogPosts.map(post => ({
      title: post.title,
      path: post.path,
      description: post.description,
      date: post.date,
      category: post.category,
      tags: post.tags,
      authors: post.authors,
      image: post.image,
      url: `https://nuxt.com${post.path}`
    }))

    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(result, null, 2)
      }]
    }
  }
})
