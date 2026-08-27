import { queryCollectionNavigation } from '@nuxt/content/server'
import type { NavigationItem } from 'comark-content'
import { DOC_VERSIONS, type DocVersion } from '#shared/utils/docs'
import { docsInstanceKey } from '#shared/utils/content'

/** One doc version's tree, with the shared examples grafted in. */
async function docTree(version: DocVersion, examples: NavigationItem[]): Promise<NavigationItem[]> {
  const content = await getInstance(docsInstanceKey(version))
  const nav = await content.navigation()

  // A prefixed source is wrapped in nodes for its prefix, so unwrap to the version root.
  const root = findByPath(nav, `/docs/${version}`)

  const children = [...(root?.children ?? [])]

  // Explicit ordering: examples used to sort here via their `4.examples` mount prefix.
  const afterApi = children.findIndex(item => item.path === `/docs/${version}/api`) + 1
  children.splice(afterApi || children.length, 0, ...examples)

  return [{
    ...(root ?? { title: 'Docs', path: `/docs/${version}` }),
    children
  }]
}

function findByPath(items: NavigationItem[] | undefined, path: string): NavigationItem | undefined {
  for (const item of items ?? []) {
    if (item.path === path) return item
    const found = findByPath(item.children, path)
    if (found) return found
  }
}

export default defineEventHandler(async (event) => {
  const examplesContent = await getInstance('examples')
  const examplesNav = await examplesContent.navigation(['examples'])
  // Not version-scoped: one subtree, linked from every version.
  const examples = findByPath(examplesNav, '/docs/examples')
  const examplesChildren = examples ? [examples] : []

  const [versions, blog] = await Promise.all([
    Promise.all(DOC_VERSIONS.map(version => docTree(version, examplesChildren).catch(() => []))),
    queryCollectionNavigation(event, 'blog')
  ])

  return [...versions.flat(), ...(blog ?? [])].filter(Boolean)
})
