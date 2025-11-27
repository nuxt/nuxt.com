export default defineMcpResource({
  uri: 'resource://nuxt-com/deploy-providers',
  description: 'Complete list of deployment providers and hosting platforms for Nuxt applications',
  async handler(uri: any) {
    const result = await $fetch('/api/mcp/list-deploy-providers')
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(result, null, 2)
      }]
    }
  }
})
