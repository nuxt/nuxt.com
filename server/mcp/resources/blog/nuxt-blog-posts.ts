export default defineMcpResource({
  uri: 'resource://nuxt-com/blog-posts',
  description: 'Complete list of Nuxt blog posts including releases, tutorials, and announcements',
  cache: '1h',
  async handler(uri: URL) {
    const blogPosts = await listChildren('/blog')

    const result = blogPosts.map(post => ({
      title: post.data.title,
      path: post.path,
      description: post.data.description,
      date: post.data.date,
      category: post.data.category,
      authors: post.data.authors,
      image: post.data.image,
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
