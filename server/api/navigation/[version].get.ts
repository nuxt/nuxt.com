import type { NavigationItem } from 'comark-content'
import { isDocVersion } from '#shared/utils/docs'

/**
 * The blog subtree the palette and the docs aside link to — grafted onto every version.
 */
async function blogTree(): Promise<NavigationItem[]> {
  const site = await getInstanceAtHead('site')
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
 * One docs version's navigation tree, plus blog — what `app/app.vue` used to fetch in full then
 * filter down to client-side. Scoping it here means the other versions never leave the server.
 */
export default defineEventHandler(async (event): Promise<NavigationItem[]> => {
  const version = getRouterParam(event, 'version')
  if (!version || !isDocVersion(version)) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown docs version' })
  }

  const examplesContent = await getInstanceAtHead('examples')
  const examplesNav = await examplesContent.navigation()
  // Not version-scoped: one subtree, linked from every version.
  const examples = findByPath(examplesNav, '/docs/examples')
  const examplesChildren = examples ? [examples] : []

  const [tree, blog] = await Promise.all([
    docTree(version, examplesChildren).catch(() => []),
    blogTree().catch(() => [])
  ])

  return withoutStem([...tree, ...blog])
})
