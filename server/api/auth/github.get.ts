import { and, eq } from 'drizzle-orm'

export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user: ghUser }) {
    const session = await getUserSession(event)

    let user = await db.query.users.findFirst({
      where: () => and(
        eq(schema.users.provider, 'github'),
        eq(schema.users.providerId, ghUser.id.toString())
      )
    })

    const role: 'user' | 'admin' = (await isAuthorizedAdmin(ghUser.login)) ? 'admin' : 'user'

    if (!user) {
      [user] = await db.insert(schema.users).values({
        id: session.id,
        name: ghUser.name || '',
        email: ghUser.email || '',
        avatar: ghUser.avatar_url || '',
        username: ghUser.login,
        provider: 'github',
        providerId: ghUser.id.toString(),
        role
      }).returning()
    } else {
      // Reassign anonymous chats (created with `session.id` as `userId`) to
      // the now-known user.
      await db.update(schema.chats).set({ userId: user!.id })
        .where(eq(schema.chats.userId, session.id))

      // Refresh role on each login so changes to NUXT_ADMIN_GITHUB_LOGINS or
      // the core team take effect on next sign-in.
      if (user.role !== role) {
        [user] = await db.update(schema.users).set({ role })
          .where(eq(schema.users.id, user.id))
          .returning()
      }
    }

    await setUserSession(event, { user })

    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/')
  }
})
