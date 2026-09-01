import type { ComarkContent, NavigationItem } from 'comark-content'
import { createComarkSource } from '#agent-discovery/comark'
import { DOC_VERSIONS } from '#shared/utils/docs'

/**
 * Content source for nuxt-agent-discovery, bridging the comark instances.
 *
 * The module's comark adapter works on one content surface; nuxt.com serves
 * eight instances (see `server/utils/content/instances.ts`). This facade
 * routes `get()` to the instance owning the path and merges every instance's
 * navigation for `list()`/`firstLeaf()` (the cli reference grafted into its
 * docs version through the same `docTree()` the UI navigation uses), so the
 * adapter's document pipeline (markdown rendering, link absolutization, the
 * `agent-discovery:document` hook) stays byte-identical with `/raw/**.md`.
 */

/**
 * Site content that is not a route of its own: data collections backing the
 * templates/video-courses pages, and the design document served at
 * `/design.md` by its own handler. Kept out of every listing an agent reads.
 */
const NON_PAGE_EXACT = new Set(['/design', '/info', '/enterprise/manual-sponsors', '/enterprise/support'])
const NON_PAGE_PREFIXES = ['/templates/', '/video-courses/']

export function isAgentListedRoute(path: string): boolean {
  return !NON_PAGE_EXACT.has(path) && !NON_PAGE_PREFIXES.some(prefix => path.startsWith(prefix))
}

function prune(items: NavigationItem[]): NavigationItem[] {
  return items
    .filter(item => !item.path || isAgentListedRoute(item.path))
    .map(item => (item.children?.length ? { ...item, children: prune(item.children) } : item))
}

const facade = {
  async navigation() {
    const [site, examplesContent, versions] = await Promise.all([
      getInstanceAtHead('site').then(content => content.navigation()),
      getInstanceAtHead('examples').catch(() => null),
      // Examples are not passed into the version trees: they are one shared
      // subtree, listed once below rather than under every version.
      Promise.all(DOC_VERSIONS.map(version => docTree(version, []).catch(() => [] as NavigationItem[])))
    ])

    const examples = examplesContent ? findByPath(await examplesContent.navigation(), '/docs/examples') : undefined

    return [
      ...prune(site),
      ...versions.flat(),
      ...(examples ? [examples] : [])
    ]
  },
  async get(path: string) {
    const content = await getInstanceAtHead(instanceFromPagePath(path))
    return content.get(path)
  }
} as unknown as ComarkContent

export default createComarkSource(() => facade)
