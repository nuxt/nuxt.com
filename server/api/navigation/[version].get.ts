import type { NavigationItem } from 'comark-content'
import { isDocVersion } from '#shared/utils/docs'

/**
 * One docs version's navigation tree, plus blog — what `app/app.vue` used to fetch in full then
 * filter down to client-side. Scoping it here means the other versions never leave the server.
 */
export default defineEventHandler(async (event): Promise<NavigationItem[]> => {
  const version = getRouterParam(event, 'version')
  if (!version || !isDocVersion(version)) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown docs version' })
  }

  return versionNavigation(version)
})
