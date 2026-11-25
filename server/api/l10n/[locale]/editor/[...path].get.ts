import { withLeadingSlash } from 'ufo'
import { isL10nLocale, isLocalisedPage, type L10nEditorPage } from '#shared/utils/l10n'

/** The segments of a localised page for the translation editor, and what the signed-in user's saves become. */
export default defineEventHandler(async (event): Promise<L10nEditorPage> => {
  const locale = getRouterParam(event, 'locale')
  const path = withLeadingSlash(getRouterParam(event, 'path') ?? '')
  if (!isL10nLocale(locale) || !isLocalisedPage(path)) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  const [{ user }, content, { bundle, glossary }] = await Promise.all([
    getUserSession(event),
    getInstanceAtHead(instanceFromPagePath(path)),
    getL10nSnapshot(locale)
  ])
  const page = await content.get(path)
  if (!page) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  const [role, segments] = await Promise.all([
    user ? l10nRole(user, locale, { cached: true }) : null,
    editorSegments(page, bundle, glossary)
  ])

  const suggestions = role === 'translator' && translationsApp()
    ? await suggestionsFor(translationsGit().git, locale, segments.map(segment => segment.hash)).catch((error) => {
        console.error(`[l10n] could not list the ${locale} suggestions`, error?.message ?? error)
        return undefined
      })
    : undefined

  setResponseHeader(event, 'cache-control', 'private, no-store')
  return { sha: bundle.sha, role, segments, ...(suggestions ? { suggestions } : {}) }
})
