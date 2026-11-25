import type { NavigationItem } from 'comark-content'
import { isDocVersion } from '#shared/utils/docs'
import { isL10nLocale, isLocalisedDocVersion, l10nNavigationPath } from '#shared/utils/l10n'
import { navigationPath } from '#shared/utils/content'

/** One docs version's navigation tree, as `/api/navigation/<version>` serves it, with localised titles. */
export default defineEventHandler(async (event): Promise<NavigationItem[]> => {
  const locale = getRouterParam(event, 'locale')
  const version = getRouterParam(event, 'version')
  if (!isL10nLocale(locale) || !version || !isDocVersion(version) || !isLocalisedDocVersion(version)) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown docs version' })
  }

  const [tree, bundle] = await Promise.all([
    event.$fetch<NavigationItem[]>(navigationPath(version)),
    getL10nBundle(locale)
  ])

  try {
    return localiseNavigation(tree, bundle)
  } catch (error) {
    console.error(`[l10n] could not localise ${l10nNavigationPath(locale, version)}, serving it in English`, error)
    return tree
  }
})
