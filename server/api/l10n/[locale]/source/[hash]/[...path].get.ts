import { withLeadingSlash } from 'ufo'
import { isL10nLocale, isLocalisedPage, type L10nSegmentSource } from '#shared/utils/l10n'
import { createError, defineHandler, getRouterParam } from 'nuxt/server'

/** The English source and provenance of one segment of a localised page, for the provenance popover. */
export default defineHandler(async (event): Promise<L10nSegmentSource> => {
  const locale = getRouterParam(event, 'locale', { decode: true })
  const hash = getRouterParam(event, 'hash', { decode: true }) ?? ''
  const path = withLeadingSlash(getRouterParam(event, 'path', { decode: true }) ?? '')
  if (!isL10nLocale(locale) || !/^[0-9a-f]{16}$/.test(hash) || !isLocalisedPage(path)) {
    throw createError({ status: 404, statusText: 'Segment not found' })
  }

  const [content, bundle] = await Promise.all([
    getInstanceAtHead(instanceFromPagePath(path)),
    getL10nBundle(locale)
  ])
  const page = await content.get(path)
  const source = page && await segmentSource(page, bundle, hash)
  if (!source) {
    throw createError({ status: 404, statusText: 'Segment not found' })
  }

  return source
})
