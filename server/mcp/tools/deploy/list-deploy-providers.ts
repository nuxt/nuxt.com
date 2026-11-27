import { defineCachedFunction } from 'nitropack/runtime'
import { hash } from 'ohash'
import type { H3Event } from 'h3'
import type { DeployProvider } from '#shared/types'

const getResult = defineCachedFunction(async (_event: H3Event) => {
  const deployProviders = (await listByDir<DeployProvider>('/deploy')).filter(provider => provider.extension === '.md' && provider.path !== '/deploy')

  if (!deployProviders.length) {
    throw createError({ statusCode: 404, message: 'Deploy providers collection not found' })
  }

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
  name: 'mcp-list-deploy-providers',
  maxAge: 3600,
  swr: false,
  getKey: event => hash([getRequestURL(event).origin])
})

export default defineMcpTool({
  description: `Lists all deployment providers and hosting platforms for Nuxt applications with their features and capabilities.

WHEN TO USE: Use this tool when you need to DISCOVER or COMPARE deployment options. Common scenarios:
- "What deployment platforms are available?" - browse all options
- "I need edge functions support" - compare features across providers
- "Show me platforms with free tiers" - search for specific features
- "What are my deployment options?" - general exploration

WHEN NOT TO USE: If you know the exact provider (e.g., "Vercel", "Cloudflare"), you can use get-deploy-provider directly with the path.

OUTPUT: Returns list of providers with titles, descriptions, and paths. Use get-deploy-provider for detailed deployment instructions.`,
  annotations: {
    readOnlyHint: true,
    openWorldHint: false
  },
  handler: () => getResult(useEvent())
})
