import { ALL_DOCS_SOURCES } from '#shared/utils/docs'

export default defineMcpResource({
  uri: 'resource://nuxt-com/documentation-pages',
  description: 'Complete list of available Nuxt documentation pages across v3.x, v4.x, and v5.x',
  cache: '1h',
  async handler(uri: URL) {
    const docs = await content.list([...ALL_DOCS_SOURCES])

    const allDocs = docs
      .filter(item => item.meta.extension === '.md' && !item.meta.stem.split('/').pop()?.startsWith('.'))
      .map((item) => {
        const version = item.path.startsWith('/docs/5.x')
          ? '5.x'
          : item.path.startsWith('/docs/3.x')
            ? '3.x'
            : '4.x'
        return {
          title: item.data.title ?? item.path,
          path: item.path,
          description: item.data.description,
          version,
          url: `https://nuxt.com${item.path}`
        }
      })

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
