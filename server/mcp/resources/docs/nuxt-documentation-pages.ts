import { queryCollection } from '@nuxt/content/server'

const VERSIONED_COLLECTIONS = [
  { collection: 'docsv3', version: '3.x' },
  { collection: 'docsv4', version: '4.x' },
  { collection: 'docsv5', version: '5.x' }
] as const

export default defineMcpResource({
  uri: 'resource://nuxt-com/documentation-pages',
  description: 'Complete list of available Nuxt documentation pages across v3.x, v4.x, and v5.x',
  cache: '1h',
  async handler(uri: URL) {
    const event = useEvent()

    const results = await Promise.all(VERSIONED_COLLECTIONS.map(async ({ collection, version }) => {
      const docs = await queryCollection(event, collection)
        .select('title', 'path', 'description')
        .all()

      return (docs ?? []).map(doc => ({
        title: doc.title,
        path: doc.path,
        description: doc.description,
        version,
        url: `https://nuxt.com${doc.path}`
      }))
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
