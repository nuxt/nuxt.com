import { withLeadingSlash } from 'ufo'
import { isL10nLocale, isLocalisedPage } from '#shared/utils/l10n'

/**
 * A localised docs page: the English page at the instance's head commit, with the translations of
 * the pinned bundle substituted. Same shape as `/api/content/<instance>/get/<path>`, plus `meta.l10n`.
 */
export default defineEventHandler(async (event) => {
  const locale = getRouterParam(event, 'locale')
  const path = withLeadingSlash(getRouterParam(event, 'path') ?? '')
  if (!isL10nLocale(locale) || !isLocalisedPage(path)) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  const [content, bundle] = await Promise.all([
    getInstanceAtHead(instanceFromPagePath(path)),
    getL10nBundle(locale)
  ])
  const page = await content.get(path)
  if (!page) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  const startedAt = performance.now()
  try {
    return await localise(page, bundle)
  } catch (error) {
    console.error(`[l10n] could not localise ${path} in ${locale}, serving it in English`, error)
    return page
  } finally {
    recordDuration('l10n.localise.ms', startedAt, { locale })
  }
})
