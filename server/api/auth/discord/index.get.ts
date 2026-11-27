import { createError, defineHandler, sendRedirect } from 'nuxt/server'

/**
 * Links a Discord account to the signed-in GitHub user, then unlocks their Nuxters roles in `./linked`.
 * Returns 404 when Discord is not configured (see `runtimeConfig.nuxters.discord`).
 */
export default defineHandler(async (event) => {
  if (!nuxtersDiscord.config().enabled) {
    throw createError({ status: 404, message: 'Discord is not configured' })
  }

  const { user } = await getUserSession(event)
  if (!user) {
    return sendRedirect(event, '/api/auth/github?redirect=/nuxters')
  }

  const auth = await useAuth()
  const { headers, response } = await auth.api.linkSocialAccount({
    body: {
      provider: 'discord',
      callbackURL: '/api/auth/discord/linked',
      errorCallbackURL: '/nuxters?discord=error'
    },
    headers: event.req.headers,
    returnHeaders: true
  })
  return redirectWithCookies(event, headers, response.url)
})
