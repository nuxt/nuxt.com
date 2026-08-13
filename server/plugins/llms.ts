import type { NavigationItem } from 'comark-content'
import { DOCS_COLLECTION_SOURCES, type DocsCollection } from '../../shared/utils/docs'

const TRIMMED_SECTIONS = new Set([
  'Nuxt v3 Documentation',
  'Nuxt v5 Documentation'
])

const DOCS_LLMS_SECTIONS: { title: string, collection: DocsCollection }[] = [
  { title: 'Nuxt v5 Documentation', collection: 'docsv5' },
  { title: 'Nuxt v4 Documentation', collection: 'docsv4' },
  { title: 'Nuxt v3 Documentation', collection: 'docsv3' }
]

function collectLinks(items: NavigationItem[], domain: string) {
  const links: { title: string, description?: string, href: string }[] = []
  const walk = (nodes: NavigationItem[]) => {
    for (const item of nodes) {
      if (item.page !== false && item.path && item.path !== '/') {
        links.push({
          title: item.title,
          description: item.description,
          href: `${domain}${item.path}.md`
        })
      }
      if (item.children?.length) walk(item.children)
    }
  }
  walk(items)
  return links
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('llms:generate', async (event, options) => {
    const domain = options.domain || getSiteUrl(event)
    const docsSections = await Promise.all(DOCS_LLMS_SECTIONS.map(async section => ({
      title: section.title,
      links: collectLinks(await content.navigation([...DOCS_COLLECTION_SOURCES[section.collection]]), domain)
    })))

    options.sections = [
      ...docsSections.filter(section => !TRIMMED_SECTIONS.has(section.title)),
      ...options.sections.filter((section: { title: string }) => !section.title.includes('Documentation') || section.title === 'Deployment Guides')
    ]
  })

  nitroApp.hooks.hook('llms:generate:full', async (_event, _options, contents) => {
    const pages = await Promise.all(
      DOCS_LLMS_SECTIONS.flatMap(section => [...DOCS_COLLECTION_SOURCES[section.collection]])
        .map(async (source) => {
          const items = await content.list(source)
          return Promise.all(
            items
              .filter(item => item.meta.extension === '.md' && !item.meta.stem.split('/').pop()?.startsWith('.'))
              .map(item => fetchContentMarkdown(item.path))
          )
        })
    )
    contents.push(...pages.flat().filter((page): page is string => Boolean(page)))
  })
})
