import type { ComarkContent, NavigationItem } from 'comark-content'
import { docsPathPrefix, EXAMPLES_PATH_PREFIX, hasExamples, type DocVersion } from '#shared/utils/docs'
import { buildModuleInstanceKey, cliInstanceKey, docsInstanceKey, moduleBuilderInstanceKey, moduleInstanceKey, type ContentInstanceKey } from '#shared/utils/content'
import { cliDocsPathPrefix, hasCliDocs } from '#shared/utils/cli'
import { buildModuleDocsPathPrefix, hasModuleBuilderDocs, moduleBuilderDocsPathPrefix } from '#shared/utils/module-builder'
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
 * The Module Builder subtree for `version`. A failure to read it leaves it out rather than failing the tree.
 */
export async function moduleBuilderTree(version: DocVersion): Promise<NavigationItem[]> {
  if (!hasModuleBuilderDocs(version)) return []

  const nav = await getInstanceAtHead(moduleBuilderInstanceKey(version)).then(content => content.navigation()).catch((error) => {
    console.error(`[content] could not read the ${version} Module Builder navigation, serving the tree without it`, error)
    return null
  })
  const root = nav && findByPath(nav, moduleBuilderDocsPathPrefix(version))

  return root ? [root] : []
}

/**
 * The `nuxt build-module` page for `version`, as an entry of its command reference.
 * A failure to read it leaves it out rather than failing the tree.
 */
export async function buildModuleTree(version: DocVersion): Promise<NavigationItem[]> {
  if (!hasModuleBuilderDocs(version)) return []

  const nav = await getInstanceAtHead(buildModuleInstanceKey(version)).then(content => content.navigation()).catch((error) => {
    console.error(`[content] could not read the ${version} build-module navigation, serving the tree without it`, error)
    return null
  })

  return commandEntry(nav ?? [], buildModuleDocsPathPrefix(version))
}

/** The page at `path`, its source's root `index.md`, as a single command entry named like a command file. */
export function commandEntry(nav: NavigationItem[], path: string): NavigationItem[] {
  const root = findByPath(nav, path)
  if (!root) return []

  const { children: _children, ...page } = root
  return [{ ...page, stem: path.split('/').pop()! }]
}

/** `commands` with `entries` in place: where comark-content would sort their file names, replacing any page at the same path. */
export function withCommandEntries(commands: NavigationItem[], entries: NavigationItem[]): NavigationItem[] {
  if (!entries.length) return commands

  const stem = (item: NavigationItem) => item.stem?.split('/').pop() ?? ''

  return commands.map((root) => {
    let children = root.children ?? []
    for (const entry of entries) {
      children = children.filter(item => item.path !== entry.path)
      const at = children.findIndex(item => stem(item).localeCompare(stem(entry), undefined, { numeric: true }) > 0)
      children = at === -1 ? [...children, entry] : [...children.slice(0, at), entry, ...children.slice(at)]
    }
    return { ...root, children }
  })
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
 * One doc version's tree, with the shared examples, the command reference and the Module Builder docs grafted in.
 * `withExamples: false` leaves the examples out, for callers that list them once on their own.
 */
export async function docTree(version: DocVersion, { withExamples = hasExamples(version) } = {}): Promise<NavigationItem[]> {
  const [content, cli, buildModule, moduleBuilder, examples] = await Promise.all([
    getInstanceAtHead(docsInstanceKey(version)),
    cliTree(version),
    buildModuleTree(version),
    moduleBuilderTree(version),
    withExamples ? examplesTree() : []
  ])
  const nav = await content.navigation()
  const commands = withCommandEntries(cli, buildModule)

  // A prefixed source is wrapped in nodes for its prefix, so unwrap to the version root.
  const root = findByPath(nav, docsPathPrefix(version))

  const children = [...(root?.children ?? [])]

  // Explicit ordering: examples used to sort here via their `4.examples` mount prefix.
  const afterApi = children.findIndex(item => item.path === `${docsPathPrefix(version)}/api`) + 1
  children.splice(afterApi || children.length, 0, ...examples)

  // The CLI docs after the API utils, the Module Builder after Nuxt Kit.
  const api = `${docsPathPrefix(version)}/api`
  const grafted = commands.length || moduleBuilder.length

  return [{
    ...(root ?? { title: 'Docs', path: docsPathPrefix(version) }),
    children: children.map(item => grafted && item.path === api
      ? { ...item, children: insertAfter(insertAfter(item.children ?? [], `${api}/utils`, commands), `${api}/kit`, moduleBuilder) }
      : item)
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

/** `items` with `nodes` inserted after the item at `path`, or at the end. */
export function insertAfter(items: NavigationItem[], path: string, nodes: NavigationItem[]): NavigationItem[] {
  const at = (items.findIndex(item => item.path === path) + 1) || items.length

  return [...items.slice(0, at), ...nodes, ...items.slice(at)]
}

export function findByPath(items: NavigationItem[] | undefined, path: string): NavigationItem | undefined {
  for (const item of items ?? []) {
    if (item.path === path) return item
    const found = findByPath(item.children, path)
    if (found) return found
  }
}
