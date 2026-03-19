import { z } from 'zod'

export default defineMcpTool({
  description: 'Gets the getting started guide for Nuxt. Parameters: version (enum, optional) - Nuxt version.',
  inputSchema: {
    // TODO: add '5.x' when Nuxt 5 is released
    version: z.enum(['3.x', '4.x']).optional().default('4.x').describe('Nuxt version'),
    sections: z.array(z.string()).optional().describe('Specific h2 section titles to return. If omitted, returns full guide.')
  },
  cache: '30m',
  async handler({ version, sections }) {
    const path = `/docs/${version}/getting-started/introduction`

    try {
      const fullContent = await $fetch<string>(`/raw${path}.md`)

      let content = fullContent
      if (sections?.length) {
        content = extractSections(fullContent, sections)
      }

      return {
        content: [{ type: 'text' as const, text: content }]
      }
    } catch (error) {
      return errorResult(`Getting started guide not found: ${error}`)
    }
  }
})
