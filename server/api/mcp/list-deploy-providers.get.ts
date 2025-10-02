import { queryCollection } from '@nuxt/content/server'

export default defineCachedEventHandler(async (event) => {
  const deployProviders = await queryCollection(event, 'deploy')
    .select('title', 'path', 'description', 'logoSrc', 'logoIcon', 'category', 'nitroPreset', 'website', 'sponsor')
    .all()

  return deployProviders.map(provider => ({
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
}, {
  maxAge: 60 * 60, // 1 hour
  getKey: () => 'mcp-deploy-providers'
})
