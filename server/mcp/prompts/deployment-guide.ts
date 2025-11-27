import { z } from 'zod/v3'

export default defineMcpPrompt({
  description: 'Get deployment instructions for a specific hosting provider',
  inputSchema: {
    // @ts-expect-error - MCP SDK has overly strict Zod type constraints
    provider: z.string().describe('Hosting provider name (e.g., "Vercel", "Netlify", "AWS", "Cloudflare")')
  },
  async handler({ provider }: { provider: string }) {
    const deployProviders = await $fetch<Array<{ title: string, path: string }>>('/api/mcp/list-deploy-providers')
    const matchingProvider = deployProviders.find(p =>
      p.title.toLowerCase().includes(provider.toLowerCase())
    )

    let providerDetails = null
    if (matchingProvider) {
      providerDetails = await $fetch('/api/mcp/get-deploy-provider', {
        query: { path: matchingProvider.path }
      })
    }

    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Help me deploy my Nuxt application to ${provider}. ${providerDetails ? `Here are the deployment instructions: ${JSON.stringify(providerDetails, null, 2)}` : `Here are all available providers: ${JSON.stringify(deployProviders, null, 2)}`}`
          }
        }
      ]
    }
  }
})
