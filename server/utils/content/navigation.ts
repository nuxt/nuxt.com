import type { NavigationItem } from 'comark-content'
import { docsPathPrefix, EXAMPLES_PATH_PREFIX, type DocVersion } from '#shared/utils/docs'
import { cliInstanceKey, docsInstanceKey } from '#shared/utils/content'
import { cliDocsPathPrefix } from '#shared/utils/cli'
import type { InstanceResolver } from './index'

/**
 * The command reference subtree for `version`.
 */
export async function cliTree(version: DocVersion, resolve: InstanceResolver = getInstanceAtHead): Promise<NavigationItem[]> {
  const content = await resolve(cliInstanceKey(version)).catch(() => null)
  if (!content) return []

  const nav = await content.navigation()
  const root = findByPath(nav, cliDocsPathPrefix(version))

  return root ? [root] : []
}

/**
 * The examples subtree. Not version-scoped: one subtree, linked from every version.
 */
export async function examplesTree(resolve: InstanceResolver = getInstanceAtHead): Promise<NavigationItem[]> {
  const nav = await resolve('examples').then(content => content.navigation()).catch((error) => {
    console.error('[content] could not read the examples navigation — serving the tree without it', error)
    return null
  })
  if (!nav) return []

  const examples = findByPath(nav, EXAMPLES_PATH_PREFIX)

  return examples ? [examples] : []
}

/** One doc version's tree, with the shared examples and the command reference grafted in. */
export async function docTree(version: DocVersion, examples: NavigationItem[], resolve: InstanceResolver = getInstanceAtHead): Promise<NavigationItem[]> {
  const [content, commands] = await Promise.all([
    resolve(docsInstanceKey(version)),
    cliTree(version, resolve)
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

/**
 * The blog subtree the palette and the docs aside link to — grafted onto every version.
 */
async function blogTree(resolve: InstanceResolver): Promise<NavigationItem[]> {
  const site = await resolve('site')
  const blog = findByPath(await site.navigation(), '/blog')

  return blog ? [blog] : []
}

/** Drop fields the client never reads off a nav item — `stem` is only ever read from page frontmatter. */
function withoutStem(items: NavigationItem[]): NavigationItem[] {
  return items.map(({ stem: _stem, children, ...item }) => ({
    ...item,
    ...(children ? { children: withoutStem(children) } : {})
  }))
}

/**
 * One docs version's navigation tree, plus blog — scoped here so the other versions never leave the server.
 * `resolve` picks each instance's commit: the live heads, or a pull request preview's.
 */
export async function versionNavigation(version: DocVersion, resolve: InstanceResolver = getInstanceAtHead): Promise<NavigationItem[]> {
  const [tree, blog] = await Promise.all([
    docTree(version, await examplesTree(resolve), resolve),
    blogTree(resolve).catch(() => [])
  ])

  return withoutStem([...tree, ...blog])
}

export function findByPath(items: NavigationItem[] | undefined, path: string): NavigationItem | undefined {
  for (const item of items ?? []) {
    if (item.path === path) return item
    const found = findByPath(item.children, path)
    if (found) return found
  }
}
