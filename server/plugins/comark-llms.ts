import { renderMarkdown } from 'comark/render'
import { withBase } from 'ufo'

/** Map llms section titles → comark-content source names (+ optional path filter). */
const SECTION_SOURCES: Record<string, { source: string, pathPrefix?: string }> = {
  'Nuxt v5 Documentation': { source: 'docsv5' },
  'Nuxt v4 Documentation': { source: 'docsv4' },
  'Nuxt v3 Documentation': { source: 'docsv3' },
  'Deployment Guides': { source: 'local', pathPrefix: '/deploy/' },
  'Blog': { source: 'local', pathPrefix: '/blog/' }
}

function filterDocs(items: Awaited<ReturnType<typeof content.list>>, pathPrefix?: string) {
  return items.filter((item) => {
    if (item.meta.extension !== '.md') return false
    if (item.path.includes('.navigation')) return false
    if (pathPrefix && !item.path.startsWith(pathPrefix)) return false
    return true
  })
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('llms:generate', async (_event, options) => {
    const sections = options.sections || []

    for (const section of sections) {
      const mapping = SECTION_SOURCES[section.title]
      if (!mapping) continue

      const items = await content.list([mapping.source])
      const docs = filterDocs(items, mapping.pathPrefix)
      if (!docs.length) continue

      section.links ||= []
      section.links.push(...docs.map((doc) => {
        const data = doc.data as Record<string, any>
        return {
          title: data.title || data.seo?.title || '',
          description: data.description || data.seo?.description || '',
          href: getDocumentLink(doc.path, options)
        }
      }))
    }
  })

  nitroApp.hooks.hook('llms:generate:full', async (_event, options, contents) => {
    const sections = options.sections || []

    for (const section of sections) {
      const mapping = SECTION_SOURCES[section.title]
      if (!mapping) continue

      const items = await content.list([mapping.source])
      const docs = filterDocs(items, mapping.pathPrefix)

      for (const doc of docs) {
        const file = await content.get(doc.path)
        if (!file) continue

        const data = (file.data || {}) as Record<string, any>
        const nodes = [...((file.nodes || []) as unknown[])]

        if ((nodes[0] as unknown[] | undefined)?.[0] !== 'h1' && data.title) {
          nodes.unshift(['h1', {}, data.title])
        }

        const markdown = await renderMarkdown({ nodes, frontmatter: data, meta: file.meta } as any)
        contents.push(markdown)
      }
    }
  })

  function getDocumentLink(path: string, options: { domain?: string }) {
    const link = `/raw${path}.md`
    return options.domain ? withBase(link, options.domain) : link
  }
})
