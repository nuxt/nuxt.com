import { recordStatus } from '@diglot/core'
import { z } from 'zod'
import { isL10nLocale, isLocalisedPage, L10N_NOTE_MAX_LENGTH, type L10nSaveResult } from '#shared/utils/l10n'

const bodySchema = z.object({
  /** The English page the changes were made on, unprefixed. */
  page: z.string().startsWith('/docs/').max(300),
  changes: z.array(z.object({
    hash: z.string().regex(/^[0-9a-f]{16}$/),
    action: z.enum(['edit', 'verify', 'reject']),
    text: z.string().max(10_000).optional(),
    base: z.string().max(10_000).nullable()
  })).min(1).max(500),
  /** Why the changes were made: in the commit message, and on the suggestion pull request. */
  note: z.string().max(L10N_NOTE_MAX_LENGTH * 2).optional()
})

/**
 * Save a translator's changes to one localised page as one commit on nuxt/translations, authored by them.
 * Members of `nuxt/translators-<locale>` commit to `main`; anyone else signed in adds to their suggestion
 * pull request. The push webhook then refreshes the served bundle and purges the pages.
 */
export default defineEventHandler(async (event): Promise<L10nSaveResult> => {
  const locale = getRouterParam(event, 'locale')
  if (!isL10nLocale(locale)) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown locale' })
  }

  assertSameOrigin(event)
  const { user } = await requireUserSession(event)
  const { page, changes, note } = await readValidatedBody(event, bodySchema.parse)
  if (!isLocalisedPage(page)) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }

  await consumeL10nSave(db, user.id, changes.length)

  const [role, file, bundle] = await Promise.all([
    l10nRole(user, locale),
    getInstanceAtHead(instanceFromPagePath(page)).then(content => content.get(page)),
    getL10nBundle(locale)
  ])
  if (!file) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }
  if (role === 'suggester') await consumeL10nSuggestion(db, user.id, changes.length)

  const { git, dryRun } = translationsGit()
  const input = { locale, page, changes: changes.map(change => ({ ...change, base: change.base ?? null })), segments: await pageSegments(file, bundle.policy), translator: { login: user.username, id: user.providerId }, note }

  try {
    const result = role === 'translator'
      ? await commitChanges(git, input, TRANSLATIONS_BRANCH)
      : await suggestChanges(git, input, TRANSLATIONS_BRANCH)
    if (result.pull) forgetSuggestions(git, locale)

    console.log(`[l10n] ${user.username} saved ${changes.length} ${locale} change(s) on ${page} as ${result.pull ? `#${result.pull.number}` : 'a commit'}: ${result.sha}${dryRun ? ' (dry run)' : ''}`)

    return {
      mode: role === 'translator' ? 'commit' : 'suggestion',
      sha: result.sha,
      segments: Object.fromEntries([...result.records].map(([hash, record]) => [hash, { status: recordStatus(record), text: record.text }])),
      ...(result.pull ? { pull: result.pull } : {}),
      ...(dryRun ? { dryRun: dryRun.commits.map(({ message, author, files }) => ({ message, author, files })) } : {})
    }
  } catch (error) {
    if (error instanceof L10nChangeError) {
      throw createError({ statusCode: 422, statusMessage: 'Some changes cannot be saved', data: { issues: error.issues } })
    }
    if (error instanceof L10nConflictError) {
      throw createError({ statusCode: 409, statusMessage: 'The translations changed while saving: try again' })
    }
    throw error
  }
})
