import { queryCollection } from '@nuxt/content/server'

export default defineMcpResource({
  uri: 'resource://nuxt-com/deploy-providers',
  description: 'Complete list of deployment providers and hosting platforms for Nuxt applications',
  cache: '1h',
  async handler(uri: URL) {
    const event = useEvent()

    const deployProviders = await queryCollection(event, 'deploy')
      .select('title', 'path', 'description', 'logoSrc', 'logoIcon', 'category', 'nitroPreset', 'website', 'sponsor')
      .all()

    if (!deployProviders) {
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
