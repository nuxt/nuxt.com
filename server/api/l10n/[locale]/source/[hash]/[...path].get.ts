import { withLeadingSlash } from 'ufo'
import { isL10nLocale, isLocalisedPage, type L10nSegmentSource } from '#shared/utils/l10n'

/** The English source and provenance of one segment of a localised page, for the provenance popover. */
export default defineEventHandler(async (event): Promise<L10nSegmentSource> => {
  const locale = getRouterParam(event, 'locale')
  const hash = getRouterParam(event, 'hash') ?? ''
  const path = withLeadingSlash(getRouterParam(event, 'path') ?? '')
  if (!isL10nLocale(locale) || !/^[0-9a-f]{16}$/.test(hash) || !isLocalisedPage(path)) {
    throw createError({ statusCode: 404, statusMessage: 'Segment not found' })
  }

  const [content, bundle] = await Promise.all([
    getInstanceAtHead(instanceFromPagePath(path)),
    getL10nBundle(locale)
  ])
  const page = await content.get(path)
  const source = page && await segmentSource(page, bundle, hash)
  if (!source) {
    throw createError({ statusCode: 404, statusMessage: 'Segment not found' })
  }

  return source
})
