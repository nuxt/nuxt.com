import type { NavigationItem } from 'comark-content'
import { isDocVersion } from '#shared/utils/docs'
import { hasModuleDocsSearch } from '#shared/utils/content'

/** Drop fields the client never reads off a nav item — `stem` is only ever read from page frontmatter. */
function withoutStem(items: NavigationItem[]): NavigationItem[] {
  return items.map(({ stem: _stem, children, ...item }) => ({
    ...item,
    ...(children ? { children: withoutStem(children) } : {})
  }))
}

/**
 * One docs version's navigation tree, plus blog and the hosted module docs — what `app/app.vue` used
 * to fetch in full then filter down to client-side. Scoping it here means the other versions never
 * leave the server. The search palette only shows results it can place in this tree.
 */
export default defineEventHandler(async (event): Promise<NavigationItem[]> => {
  const version = getRouterParam(event, 'version')
  if (!version || !isDocVersion(version)) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown docs version' })
  }
  const [tree, blog, modules] = await Promise.all([
    docTree(version),
    blogTree().catch(() => []),
    hasModuleDocsSearch(version) ? moduleDocsTrees() : []
  ])

  return withoutStem([...tree, ...blog, ...modules])
})
