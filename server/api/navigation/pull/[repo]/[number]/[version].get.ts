import type { NavigationItem } from 'comark-content'
import { isDocVersion } from '#shared/utils/docs'

/**
 * `/api/navigation/:version`, as a pull request previews it.
 */
export default defineEventHandler(async (event): Promise<NavigationItem[]> => {
  const target = pullTargetFromEvent(event)
  const version = getRouterParam(event, 'version')
  if (!version || !isDocVersion(version)) {
    throw createError({ status: 404, statusText: 'Unknown docs version' })
  }

  return versionNavigation(version, pullResolver(await resolvePullPreview(target)))
})
