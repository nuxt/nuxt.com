import { and, desc, eq } from 'drizzle-orm'

/** Where Better Auth returns once Discord is linked: adds the user to the Nuxt guild and grants their Nuxters roles. */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  // A user can have linked several Discord accounts over time. Linking writes the account it
  // just authorised (new row or refreshed tokens), so the most recently updated one is it.
  const account = await db.query.authAccounts.findFirst({
    where: () => and(eq(schema.authAccounts.userId, user.id), eq(schema.authAccounts.providerId, 'discord')),
    orderBy: () => desc(schema.authAccounts.updatedAt)
  })
  if (!account) {
    return sendRedirect(event, '/nuxters?discord=error')
  }

  const nuxter = await nuxters.getByGithubId(user.providerId)
  const badges = await nuxters.badges(event, user, nuxter)
  let roles: string[]
  let username: string
  try {
    const auth = await useAuth()
    const { accessToken } = await auth.api.getAccessToken({ body: { accountId: account.id }, headers: event.headers })
    ;({ username } = await $fetch<{ username: string }>('https://discord.com/api/v10/users/@me', {
      headers: { authorization: `Bearer ${accessToken}` }
    }))
    roles = await nuxtersDiscord.grant(event, { discordId: account.accountId, accessToken, badges })
  } catch (error) {
    console.error('Discord role grant failed:', error)
    return sendRedirect(event, '/nuxters?discord=error')
  }

  const row = await db.query.users.findFirst({ where: () => eq(schema.users.id, user.id) })
  await db.update(schema.users).set({
    metadata: {
      ...row?.metadata,
      discord: { id: account.accountId, username, roles, linkedAt: new Date().toISOString() }
    }
  }).where(eq(schema.users.id, user.id))

  return sendRedirect(event, '/nuxters?discord=linked')
})
