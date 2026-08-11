export default defineMcpResource({
  uri: 'resource://nuxt-com/deploy-providers',
  description: 'Complete list of deployment providers and hosting platforms for Nuxt applications',
  cache: '1h',
  async handler(uri: URL) {
    const items = await content.list(['local'])

    const deployProviders = items
      .filter(item => item.path.startsWith('/deploy/') && item.path !== '/deploy')

    if (!deployProviders.length) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Deploy providers collection not found' })
        }]
      }
    }

    const result = deployProviders.map(item => ({
      title: item.data.title,
      name: item.data.title,
      path: item.path,
      description: item.data.description,
      logoSrc: item.data.logoSrc,
      logoIcon: item.data.logoIcon,
      category: item.data.category,
      nitroPreset: item.data.nitroPreset,
      website: item.data.website,
      sponsor: item.data.sponsor,
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
