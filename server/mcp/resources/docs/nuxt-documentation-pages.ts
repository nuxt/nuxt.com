import { defineCachedFunction } from 'nitropack/runtime'
import { hash } from 'ohash'
import type { H3Event } from 'h3'
import { cliInstanceKey, docsInstanceKey } from '#shared/utils/content'
import { AGENT_DOC_VERSIONS } from '#shared/utils/docs'

const getResult = defineCachedFunction(async (event: H3Event, uri: URL) => {
  const results = await Promise.all(AGENT_DOC_VERSIONS.map(async (version) => {
    const [docs, cli] = await Promise.all([
      listInstancePages(docsInstanceKey(version)),
      listInstancePages(cliInstanceKey(version)).catch(() => [])
    ])

    return [...docs, ...cli].map(doc => ({
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
}, {
  name: 'mcp-nuxt-documentation-pages',
  maxAge: 3600,
  swr: false,
  getKey: (event, uri) => hash([getRequestURL(event).origin, uri.href])
})

export default defineMcpResource({
  uri: 'resource://nuxt-com/documentation-pages',
  description: 'Complete list of available Nuxt documentation pages across v3.x, v4.x, and v5.x',
  handler: uri => getResult(useEvent(), uri)
})
