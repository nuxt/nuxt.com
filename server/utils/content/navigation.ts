import type { ComarkContent, NavigationItem } from 'comark-content'
import { docsPathPrefix, EXAMPLES_PATH_PREFIX, hasExamples, type DocVersion } from '#shared/utils/docs'
import { cliInstanceKey, docsInstanceKey, moduleInstanceKey, type ContentInstanceKey } from '#shared/utils/content'
import { cliDocsPathPrefix, hasCliDocs } from '#shared/utils/cli'
import { MODULE_DOCS_NAMES, moduleDocsPathPrefix } from '#shared/utils/module-docs'

/**
 * The command reference subtree for `version`.
 */
export async function cliTree(version: DocVersion): Promise<NavigationItem[]> {
  if (!hasCliDocs(version)) return []

  const content = await getInstanceAtHead(cliInstanceKey(version)).catch(() => null)
  if (!content) return []

  const nav = await content.navigation()
  const root = findByPath(nav, cliDocsPathPrefix(version))

  return root ? [root] : []
}

/**
 * The examples subtree. Not version-scoped: one subtree, linked from every version.
 */
export async function examplesTree(): Promise<NavigationItem[]> {
  const nav = await getInstanceAtHead('examples').then(content => content.navigation()).catch((error) => {
    console.error('[content] could not read the examples navigation — serving the tree without it', error)
    return null
  })
  if (!nav) return []

  const examples = findByPath(nav, EXAMPLES_PATH_PREFIX)

  return examples ? [examples] : []
}

/**
 * Each hosted module's docs, rooted at its module page. Not version-scoped, like the examples.
 * A module whose docs cannot be read is left out rather than failing the tree.
 * `getInstance` lets a pull request preview read them through its own instances.
 */
export async function moduleDocsTrees(getInstance: (key: ContentInstanceKey) => Promise<ComarkContent> = getInstanceAtHead): Promise<NavigationItem[]> {
  const trees = await Promise.all(MODULE_DOCS_NAMES.map(name => getInstance(moduleInstanceKey(name))
    .then(async (content) => {
      const root = findByPath(await content.navigation(), moduleDocsPathPrefix(name))
      if (!root) return undefined
      // The root already is the module page (`index.md`): drop its duplicate child, but keep its
      // title (`Quick Start`) for the search palette to label the page with, under the module's.
      // Its icon, the header's Modules one, is what the search palette shows on the module's results.
      const index = root.children?.find(item => item.path === root.path)
      return {
        ...root,
        icon: root.icon || 'i-lucide-puzzle',
        ...(index && index.title !== root.title ? { indexTitle: index.title } : {}),
        children: root.children?.filter(item => item.path !== root.path)
      }
    })
    .catch((error) => {
      console.error(`[content] could not read the ${name} module docs navigation — serving the tree without it`, error)
      return undefined
    })))

  return trees.filter(item => !!item)
}

/**
 * One doc version's tree, with the shared examples and the command reference grafted in.
 * `withExamples: false` leaves the examples out, for callers that list them once on their own.
 */
export async function docTree(version: DocVersion, { withExamples = hasExamples(version) } = {}): Promise<NavigationItem[]> {
  const [content, commands, examples] = await Promise.all([
    getInstanceAtHead(docsInstanceKey(version)),
    cliTree(version),
    withExamples ? examplesTree() : []
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
export async function blogTree(): Promise<NavigationItem[]> {
  const site = await getInstanceAtHead('site')
  const blog = findByPath(await site.navigation(), '/blog')

  return blog ? [blog] : []
}

export function findByPath(items: NavigationItem[] | undefined, path: string): NavigationItem | undefined {
  for (const item of items ?? []) {
    if (item.path === path) return item
    const found = findByPath(item.children, path)
    if (found) return found
  }
}
