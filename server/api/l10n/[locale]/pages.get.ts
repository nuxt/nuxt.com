import { isL10nLocale, type L10nPageStatus } from '#shared/utils/l10n'

/** The review state of each localised page of a locale. */
export default defineEventHandler(async (event): Promise<L10nPageStatus[]> => {
  const locale = getRouterParam(event, 'locale')
  if (!isL10nLocale(locale)) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown locale' })
  }
  return (await getL10nStatus(locale)).pages
})
