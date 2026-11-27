import type { NavigationItem } from 'comark-content'
import { isDocVersion } from '#shared/utils/docs'
import { createError, defineHandler, getRouterParam } from 'nuxt/server'

/**
 * `/api/navigation/:version`, as a pull request previews it.
 */
export default defineHandler(async (event): Promise<NavigationItem[]> => {
  const target = pullTargetFromEvent(event)
  const version = getRouterParam(event, 'version', { decode: true })
  if (!version || !isDocVersion(version)) {
    throw createError({ status: 404, statusText: 'Unknown docs version' })
  }

  return pullNavigation(version, await resolvePullPreview(target))
})
