import { docsInstanceKey } from '#shared/utils/content'
import { DOC_VERSIONS } from '#shared/utils/docs'

export default defineMcpResource({
  uri: 'resource://nuxt-com/documentation-pages',
  description: 'Complete list of available Nuxt documentation pages across v3.x, v4.x, and v5.x',
  cache: '1h',
  async handler(uri: URL) {
    const results = await Promise.all(DOC_VERSIONS.map(async (version) => {
      const docs = await listInstancePages(docsInstanceKey(version))

      return docs.map(doc => ({
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
