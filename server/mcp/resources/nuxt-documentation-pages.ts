import { queryCollection } from '@nuxt/content/server'

export default defineMcpResource({
  uri: 'resource://nuxt-com/documentation-pages',
  description: 'Complete list of available Nuxt documentation pages (defaults to v4.x)',
  cache: '1h',
  async handler(uri: URL) {
    const event = useEvent()

    const allDocs = await queryCollection(event, 'docsv4')
      .select('title', 'path', 'description')
      .all()

    if (!allDocs) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Documentation pages collection not found' })
        }]
      }
    }

    const result = allDocs.map(doc => ({
      title: doc.title,
      path: doc.path,
      description: doc.description,
      version: '4.x',
      url: `https://nuxt.com${doc.path}`
    }))

    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(result, null, 2)
      }]
    }
  }
})
