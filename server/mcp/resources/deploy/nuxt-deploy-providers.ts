import type { DeployProvider } from '#shared/types'

export default defineMcpResource({
  uri: 'resource://nuxt-com/deploy-providers',
  description: 'Complete list of deployment providers and hosting platforms for Nuxt applications',
  cache: '1h',
  async handler(uri: URL) {
    const deployProviders = (await listByDir<DeployProvider>('/deploy')).filter(provider => provider.extension === '.md' && provider.path !== '/deploy')

    if (!deployProviders.length) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Deploy providers collection not found' })
        }]
      }
    }

    const result = deployProviders.map(provider => ({
      title: provider.title,
      name: provider.title,
      path: provider.path,
      description: provider.description,
      logoSrc: provider.logoSrc,
      logoIcon: provider.logoIcon,
      category: provider.category,
      nitroPreset: provider.nitroPreset,
      website: provider.website,
      sponsor: provider.sponsor,
      url: `https://nuxt.com${provider.path}`
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
