import { docsSourceGroups } from '#shared/utils/docs'

const VERSIONED_SOURCES = [
  { sources: docsSourceGroups.docsv3, version: '3.x' },
  { sources: docsSourceGroups.docsv4, version: '4.x' },
  { sources: docsSourceGroups.docsv5, version: '5.x' }
] as const

export default defineMcpResource({
  uri: 'resource://nuxt-com/documentation-pages',
  description: 'Complete list of available Nuxt documentation pages across v3.x, v4.x, and v5.x',
  cache: '1h',
  async handler(uri: URL) {
    const results = await Promise.all(VERSIONED_SOURCES.map(async ({ sources, version }) => {
      const items = await content.list([...sources])

      return items.map((item) => {
        const data = item.data as Record<string, any>
        return {
          title: data.title || '',
          path: item.path,
          description: data.description || '',
          version,
          url: `https://nuxt.com${item.path}`
        }
      })
    }))

    const allDocs = results.flat()

    if (allDocs.length === 0) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Documentation pages collections not found' })
        }]
      }
    }

    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(allDocs, null, 2)
      }]
    }
  }
})
