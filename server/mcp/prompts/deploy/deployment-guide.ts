import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'
import { getAgentDocument, getAgentSiteUrl } from '#agent-discovery'

export default defineMcpPrompt({
  description: 'Get deployment instructions for a specific hosting provider',
  inputSchema: {
    provider: z.string().describe('Hosting provider name (e.g., "Vercel", "Netlify", "AWS", "Cloudflare")')
  },
  async handler({ provider }) {
    const event = useEvent()

    const deployProviders = await queryCollection(event, 'deploy')
      .select('title', 'path', 'description')
      .all()

    const allProviders = deployProviders?.map(p => ({
      title: p.title,
      path: p.path,
      description: p.description,
      url: `${getAgentSiteUrl(event)}${p.path}`
    })) || []

    const matchingProvider = deployProviders?.find(p =>
      p.title.toLowerCase().includes(provider.toLowerCase())
    )

    const providerDocument = matchingProvider
      ? await getAgentDocument(event, matchingProvider.path)
      : null
    const providerContent = providerDocument && !('redirect' in providerDocument)
      ? providerDocument.markdown
      : null

    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Help me deploy my Nuxt application to ${provider}. ${providerContent ? `Here are the deployment instructions:\n\n${providerContent}` : `Here are all available providers: ${JSON.stringify(allProviders, null, 2)}`}`
          }
        }
      ]
    }
  }
})
