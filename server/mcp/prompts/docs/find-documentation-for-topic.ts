import { z } from 'zod'
import { docsSourcesFromCollection } from '#shared/utils/docs'

export default defineMcpPrompt({
  description: 'Find the best Nuxt documentation for a specific topic or feature',
  inputSchema: {
    topic: z.string().describe('Describe what you want to learn about (e.g., "server-side rendering", "data fetching", "routing")'),
    version: z.enum(['3.x', '4.x', '5.x']).optional().describe('Documentation version to search (defaults to 4.x)')
  },
  async handler({ topic, version = '4.x' }) {
    const sources = [...docsSourcesFromCollection(
      version === '5.x' ? 'docsv5' : version === '3.x' ? 'docsv3' : 'docsv4'
    )]

    const items = await content.list(sources)

    const allPages = items.map((item) => {
      const data = item.data as Record<string, any>
      return {
        title: data.title || '',
        path: item.path,
        description: data.description || '',
        version,
        url: `https://nuxt.com${item.path}`
      }
    })

    return {
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Help me find the best Nuxt documentation for this topic: "${topic}". Here are all available documentation pages. Please identify the most relevant pages based on their titles and descriptions, then use get_documentation_page to retrieve the full content of the most relevant ones: ${JSON.stringify(allPages, null, 2)}`
          }
        }
      ]
    }
  }
})
