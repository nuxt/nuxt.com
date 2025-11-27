import { z } from 'zod'
import { queryCollection } from '@nuxt/content/server'

export default defineMcpPrompt({
  description: 'Find the best Nuxt documentation for a specific topic or feature',
  inputSchema: {
    topic: z.string().describe('Describe what you want to learn about (e.g., "server-side rendering", "data fetching", "routing")'),
    version: z.enum(['3.x', '4.x']).optional().describe('Documentation version to search (defaults to 4.x)')
  },
  async handler({ topic, version = '4.x' }) {
    const event = useEvent()
    const docsVersion = version === '4.x' ? 'docsv4' : 'docsv3'

    const allDocs = await queryCollection(event, docsVersion)
      .select('title', 'path', 'description')
      .all()

    const allPages = allDocs?.map(doc => ({
      title: doc.title,
      path: doc.path,
      description: doc.description,
      version,
      url: `https://nuxt.com${doc.path}`
    })) || []

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
