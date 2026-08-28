import type { NavigationItem } from 'comark-content'
import { DOC_VERSIONS, docsPathPrefix, type DocVersion } from '#shared/utils/docs'
import { cliInstanceKey, docsInstanceKey } from '#shared/utils/content'
import { cliDocsPathPrefix } from '#shared/utils/cli'

/**
 * The command reference subtree for `version`.
 */
async function cliTree(version: DocVersion): Promise<NavigationItem[]> {
  const content = await getInstanceAtHead(cliInstanceKey(version)).catch(() => null)
  if (!content) return []

  const nav = await content.navigation()
  const root = findByPath(nav, cliDocsPathPrefix(version))

  return root ? [root] : []
}

/** One doc version's tree, with the shared examples and the command reference grafted in. */
async function docTree(version: DocVersion, examples: NavigationItem[]): Promise<NavigationItem[]> {
  const [content, commands] = await Promise.all([
    getInstanceAtHead(docsInstanceKey(version)),
    cliTree(version)
  ])
  const nav = await content.navigation()

  // A prefixed source is wrapped in nodes for its prefix, so unwrap to the version root.
  const root = findByPath(nav, docsPathPrefix(version))

  const children = [...(root?.children ?? [])]

  // Explicit ordering: examples used to sort here via their `4.examples` mount prefix.
  const afterApi = children.findIndex(item => item.path === `${docsPathPrefix(version)}/api`) + 1
  children.splice(afterApi || children.length, 0, ...examples)

  // Locate CLI docs after the API docs.
  if (commands.length) {
    const api = findByPath(children, `${docsPathPrefix(version)}/api`)
    if (api) {
      const apiChildren = [...(api.children ?? [])]
      const afterUtils = apiChildren.findIndex(item => item.path === `${docsPathPrefix(version)}/api/utils`) + 1
      apiChildren.splice(afterUtils || apiChildren.length, 0, ...commands)
      api.children = apiChildren
    }
  }

  return [{
    ...(root ?? { title: 'Docs', path: docsPathPrefix(version) }),
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

/**
 * The blog subtree the palette and the docs aside link to.
 */
async function blogTree(): Promise<NavigationItem[]> {
  const site = await getInstanceAtHead('site')
  const blog = findByPath(await site.navigation(['site']), '/blog')

  return blog ? [blog] : []
}

export default defineEventHandler(async () => {
  const examplesContent = await getInstanceAtHead('examples')
  const examplesNav = await examplesContent.navigation(['examples'])
  // Not version-scoped: one subtree, linked from every version.
  const examples = findByPath(examplesNav, '/docs/examples')
  const examplesChildren = examples ? [examples] : []

  const [versions, blog] = await Promise.all([
    Promise.all(DOC_VERSIONS.map(version => docTree(version, examplesChildren).catch(() => []))),
    blogTree().catch(() => [])
  ])

  return [...versions.flat(), ...blog].filter(Boolean)
})
