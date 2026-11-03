import { isL10nLocale } from '#shared/utils/l10n'

/**
 * Open the pull request the governance rule recommends for a locale's machine translation switch.
 * Admins only; merging it is the decision.
 */
export default defineEventHandler(async (event) => {
  const locale = getRouterParam(event, 'locale')
  if (!isL10nLocale(locale)) {
    throw createError({ statusCode: 404, statusMessage: 'Unknown locale' })
  }

  assertSameOrigin(event)
  const { user } = await requireUserSession(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const { recommendation } = await getL10nStatus(locale)
  if (!recommendation) {
    throw createError({ statusCode: 409, statusMessage: 'The governance rule recommends no change' })
  }

  const { git, dryRun } = translationsGit()
  const pull = await proposeMachineSwitch(git, { locale, ...recommendation, admin: { login: user.username, id: user.providerId } })
  return { pull, ...(dryRun ? { dryRun: dryRun.commits.map(({ message, author, files }) => ({ message, author, files })) } : {}) }
})
