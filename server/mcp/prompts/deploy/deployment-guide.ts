import { z } from 'zod'

export default defineMcpPrompt({
  description: 'Get deployment instructions for a specific hosting provider',
  inputSchema: {
    provider: z.string().describe('Hosting provider name (e.g., "Vercel", "Netlify", "AWS", "Cloudflare")')
  },
  async handler({ provider }) {
    const event = useEvent()

    const items = await content.list(['local'])
    const deployProviders = items.filter(item => item.path.startsWith('/deploy/') && item.path !== '/deploy')

    const allProviders = deployProviders.map(item => ({
      title: item.data.title || '',
      path: item.path,
      description: item.data.description || '',
      url: `https://nuxt.com${item.path}`
    }))

    const matchingProvider = allProviders.find(p =>
      p.title.toLowerCase().includes(provider.toLowerCase())
    )

    const providerContent = matchingProvider
      ? await fetchPageMarkdown(event, 'local', matchingProvider.path)
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
