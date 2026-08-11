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

    const result = deployProviders.map((item) => {
      const data = item.data as Record<string, any>
      return {
        title: data.title,
        name: data.title,
        path: item.path,
        description: data.description,
        logoSrc: data.logoSrc,
        logoIcon: data.logoIcon,
        category: data.category,
        nitroPreset: data.nitroPreset,
        website: data.website,
        sponsor: data.sponsor,
        url: `https://nuxt.com${item.path}`
      }
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
