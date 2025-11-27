import { queryCollection } from '@nuxt/content/server'

export default defineMcpTool({
  description: `Lists all deployment providers and hosting platforms for Nuxt applications with their features and capabilities.

WHEN TO USE: Use this tool when you need to DISCOVER or COMPARE deployment options. Common scenarios:
- "What deployment platforms are available?" - browse all options
- "I need edge functions support" - compare features across providers
- "Show me platforms with free tiers" - search for specific features
- "What are my deployment options?" - general exploration

WHEN NOT TO USE: If you know the exact provider (e.g., "Vercel", "Cloudflare"), you can use get_deploy_provider directly with the path.

OUTPUT: Returns list of providers with titles, descriptions, and paths. Use get_deploy_provider for detailed deployment instructions.`,
  cache: '1h',
  async handler() {
    const event = useEvent()

    const deployProviders = await queryCollection(event, 'deploy')
      .select('title', 'path', 'description', 'logoSrc', 'logoIcon', 'category', 'nitroPreset', 'website', 'sponsor')
      .all()

    if (!deployProviders) {
      return {
        content: [{ type: 'text' as const, text: 'Deploy providers collection not found' }],
        isError: true
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
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
    }
  }
})
