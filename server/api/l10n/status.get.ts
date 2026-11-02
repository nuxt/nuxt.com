import { L10N_LOCALE_CODES, type L10nLocaleSummary } from '#shared/utils/l10n'

/** The review state of every locale, for `/translations`; the pages are listed by `/api/l10n/<locale>/pages`. */
export default defineEventHandler(async (): Promise<{ locales: L10nLocaleSummary[] }> => {
  const statuses = await Promise.all(L10N_LOCALE_CODES.map(locale => getL10nStatus(locale)))
  return { locales: statuses.map(({ pages, ...summary }) => ({ ...summary, pageCount: pages.length })) }
})
