import type { NavigationItem } from 'comark-content'
import { isDocVersion } from '#shared/utils/docs'
import { isL10nLocale, isLocalisedDocVersion, l10nNavigationPath } from '#shared/utils/l10n'
import { navigationPath } from '#shared/utils/content'
import { createError, defineHandler, getRouterParam, serverFetch } from 'nuxt/server'

/** One docs version's navigation tree, as `/api/navigation/<version>` serves it, with localised titles. */
export default defineHandler(async (event): Promise<NavigationItem[]> => {
  const locale = getRouterParam(event, 'locale', { decode: true })
  const version = getRouterParam(event, 'version', { decode: true })
  if (!isL10nLocale(locale) || !version || !isDocVersion(version) || !isLocalisedDocVersion(version)) {
    throw createError({ status: 404, statusText: 'Unknown docs version' })
  }

  const [response, bundle] = await Promise.all([
    serverFetch(event, navigationPath(version)),
    getL10nBundle(locale)
  ])
  if (!response.ok) {
    throw createError({ status: response.status, statusText: 'Navigation unavailable' })
  }
  const tree: NavigationItem[] = await response.json()

  try {
    return localiseNavigation(tree, bundle)
  } catch (error) {
    console.error(`[l10n] could not localise ${l10nNavigationPath(locale, version)}, serving it in English`, error)
    return tree
  }
})
