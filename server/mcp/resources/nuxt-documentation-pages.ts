export default defineMcpResource({
  uri: 'resource://nuxt-com/documentation-pages',
  metadata: {
    description: 'Complete list of available Nuxt documentation pages (defaults to v4.x, use ?version=3.x or ?version=all for other versions)'
  },
  async handler(uri: any) {
    const result = await $fetch('/api/mcp/list-documentation-pages', {
      query: { version: '4.x' }
    })
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(result, null, 2)
      }]
    }
  }
})
