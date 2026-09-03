import type { NavigationItem } from 'comark-content'
import { DOC_VERSIONS } from '#shared/utils/docs'

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
