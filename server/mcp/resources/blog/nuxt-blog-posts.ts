export default defineMcpResource({
  uri: 'resource://nuxt-com/blog-posts',
  description: 'Complete list of Nuxt blog posts including releases, tutorials, and announcements',
  cache: '1h',
  async handler(uri: URL) {
    const items = await content.list(['local'])

    const blogPosts = items.filter(item => item.path.startsWith('/blog/') && item.path !== '/blog')

    if (!blogPosts.length) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Blog posts collection not found' })
        }]
      }
    }

    const result = blogPosts.map(item => ({
      title: item.data.title,
      path: item.path,
      description: item.data.description,
      date: item.data.date,
      category: item.data.category,
      authors: item.data.authors,
      image: item.data.image,
      url: `https://nuxt.com${item.path}`
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
