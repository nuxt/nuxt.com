import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

export default defineMcpPrompt({
  description: 'Get deployment instructions for a specific hosting provider',
  inputSchema: {
    provider: z.string().describe('Hosting provider name (e.g., "Vercel", "Netlify", "AWS", "Cloudflare")')
  },
  async handler({ provider }) {
    const event = useEvent()

    const deployProviders = await queryCollection(event, 'deploy')
      .select('title', 'path', 'description', 'body', 'logoSrc', 'logoIcon', 'category', 'nitroPreset', 'website', 'sponsor')
      .all()

    const allProviders = deployProviders?.map(p => ({
      title: p.title,
      path: p.path,
      description: p.description,
      url: `https://nuxt.com${p.path}`
    })) || []

    const matchingProvider = deployProviders?.find(p =>
      p.title.toLowerCase().includes(provider.toLowerCase())
    )

    let providerDetails = null
    if (matchingProvider) {
      providerDetails = {
        title: matchingProvider.title,
        path: matchingProvider.path,
        description: matchingProvider.description,
        content: matchingProvider.body,
        logoSrc: matchingProvider.logoSrc,
        logoIcon: matchingProvider.logoIcon,
        category: matchingProvider.category,
        nitroPreset: matchingProvider.nitroPreset,
        website: matchingProvider.website,
        sponsor: matchingProvider.sponsor,
        url: `https://nuxt.com${matchingProvider.path}`
      }
    }

    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Help me deploy my Nuxt application to ${provider}. ${providerDetails ? `Here are the deployment instructions: ${JSON.stringify(providerDetails, null, 2)}` : `Here are all available providers: ${JSON.stringify(allProviders, null, 2)}`}`
          }
        }
      ]
    }
  }
})
