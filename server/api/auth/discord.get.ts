/**
 * Link a Discord account to the signed-in GitHub user, then unlock their Nuxters roles.
 * Returns 404 when Discord is not configured (see `runtimeConfig.nuxters.discord`).
 */
const oauthHandler = defineOAuthDiscordEventHandler({
  config: {
    scope: ['identify', 'guilds.join']
  },
  async onSuccess(event, { user: discordUser, tokens }) {
    const { user } = await requireUserSession(event)

    const nuxter = await nuxters.getByGithubId(user.providerId)
    const badges = await nuxters.badges(event, user, nuxter)
    const roles = await nuxtersDiscord.grant(event, {
      discordId: discordUser.id,
      accessToken: tokens.access_token,
      badges
    })

    const row = await db.query.users.findFirst({ where: () => eq(schema.users.id, user.id) })
    await db.update(schema.users).set({
      metadata: {
        ...row?.metadata,
        discord: {
          id: discordUser.id,
          username: discordUser.username,
          roles,
          linkedAt: new Date().toISOString()
        }
      }
    }).where(eq(schema.users.id, user.id))

    return sendRedirect(event, '/nuxters?discord=linked')
  },
  onError(event, error) {
    console.error('Discord OAuth error:', error)
    return sendRedirect(event, '/nuxters?discord=error')
  }
})

export default defineEventHandler(async (event) => {
  if (!nuxtersDiscord.config(event).enabled) {
    throw createError({ statusCode: 404, statusMessage: 'Discord is not configured' })
  }

  const { user } = await getUserSession(event)
  if (!user) {
    return sendRedirect(event, '/api/auth/github?redirect=/nuxters')
  }

  return oauthHandler(event)
})
