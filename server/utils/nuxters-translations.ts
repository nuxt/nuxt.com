import type { H3Event } from 'h3'
import type { NuxterLocaleTranslations } from '#shared/types'
import { L10N_LOCALE_CODES, type L10nLocale } from '#shared/utils/l10n'

/**
 * Who edited, verified and rejected the segments of a locale, built once per translations commit:
 * a profile is then a lookup. The commit is in the key, so a push needs no purge.
 */
const translationsIndex = defineCachedFunction(async (_event: H3Event, locale: L10nLocale, sha: string) => {
  const bundle = await getL10nBundle(locale)
  if (bundle.sha !== sha) throw new Error(`the ${locale} bundle is at ${bundle.sha || 'no commit'}, not ${sha}`)
  return l10nContributors(bundle)
}, {
  name: 'nuxter-translations',
  maxAge: 7 * 24 * 60 * 60,
  getKey: (_event, locale, sha) => `${locale}-${sha}`
})

/**
 * What a GitHub login did in each locale of the served translations. Translations are a bonus on a
 * profile: a locale that cannot be read lists nothing.
 */
export async function nuxterTranslations(event: H3Event, username: string): Promise<NuxterLocaleTranslations[]> {
  const sha = await resolveTranslationsSha().catch((error) => {
    console.error('[nuxters] Cannot resolve the translations commit:', error)
    return null
  })
  if (!sha) return []

  const login = username.toLowerCase()
  const locales = await Promise.all(L10N_LOCALE_CODES.map(async (locale) => {
    const index = await translationsIndex(event, locale, sha).catch((error) => {
      console.error(`[nuxters] Cannot index the ${locale} translations:`, error)
      return null
    })
    const stats = index && Object.hasOwn(index, login) ? index[login]! : null
    return stats ? [{ locale, ...stats }] : []
  }))
  return locales.flat()
}
