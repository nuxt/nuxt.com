export default defineMcpResource({
  uri: 'resource://nuxt-com/blog-posts',
  description: 'Complete list of Nuxt blog posts including releases, tutorials, and announcements',
  async handler(uri: any) {
    const result = await $fetch('/api/mcp/list-blog-posts')
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(result, null, 2)
      }]
    }
  }
})
