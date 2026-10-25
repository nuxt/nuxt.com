import type { ComarkContent, NavigationItem } from 'comark-content'
import { createComarkSource } from '#agent-discovery/comark'
import { AGENT_DOC_VERSIONS } from '#shared/utils/docs'
import { moduleInstanceKey } from '#shared/utils/content'
import { MODULE_DOCS_NAMES, moduleDocsPathPrefix } from '#shared/utils/module-docs'

/**
 * Content source for nuxt-agent-discovery, bridging the comark instances.
 *
 * The module's comark adapter works on one content surface; nuxt.com serves
 * several instances (see `server/utils/content/instances.ts`). This facade
 * routes `get()` to the instance owning the path and merges every instance's
 * navigation for `list()`/`firstLeaf()` (the cli reference grafted into its
 * docs version through the same `docTree()` the UI navigation uses), so the
 * adapter's document pipeline (markdown rendering, link absolutization, the
 * `agent-discovery:document` hook) stays byte-identical with `/raw/**.md`.
 */

/** Return only the items with a route of their own (see `isContentRoute`). */
function prune(items: NavigationItem[]): NavigationItem[] {
  return items
    .filter(item => !item.path || isContentRoute(item.path))
    .map(item => (item.children?.length ? { ...item, children: prune(item.children) } : item))
}

const facade = {
  async navigation() {
    const [site, examplesContent, versions, moduleDocs] = await Promise.all([
      getInstanceAtHead('site').then(content => content.navigation()),
      getInstanceAtHead('examples').catch(() => null),
      // Examples are left out of the version trees
      Promise.all(AGENT_DOC_VERSIONS.map(version => docTree(version, { withExamples: false }).catch(() => [] as NavigationItem[]))),
      // Each module's docs, rooted at its module page
      Promise.all(MODULE_DOCS_NAMES.map(name => getInstanceAtHead(moduleInstanceKey(name))
        .then(async (content) => {
          const root = findByPath(await content.navigation(), moduleDocsPathPrefix(name))
          // The root already is the module page (`index.md`): drop its duplicate `Overview` child.
          return root && { ...root, children: root.children?.filter(item => item.path !== root.path) }
        })
        .catch(() => undefined)))
    ])

    const examples = examplesContent ? findByPath(await examplesContent.navigation(), '/docs/examples') : undefined

    return [
      ...prune(site),
      ...versions.flat(),
      ...(examples ? [examples] : []),
      ...moduleDocs.filter(item => !!item)
    ]
  },
  async get(path: string) {
    const content = await getInstanceAtHead(instanceFromPagePath(path))
    return content.get(path)
  }
} as ComarkContent

export default createComarkSource(() => facade)
