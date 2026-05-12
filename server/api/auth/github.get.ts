import { and, eq } from 'drizzle-orm'
import { getQuery, setCookie, getCookie, deleteCookie, defineEventHandler } from 'h3'

const oauthHandler = defineOAuthGitHubEventHandler({
  async onSuccess(event, { user: ghUser }) {
    const redirectTo = getCookie(event, 'oauth-redirect') || '/'
    deleteCookie(event, 'oauth-redirect')
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

      if (user.role !== role) {
        [user] = await db.update(schema.users).set({ role })
          .where(eq(schema.users.id, user.id))
          .returning()
      }
    }

    await setUserSession(event, { user })

    return sendRedirect(event, redirectTo)
  },
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/')
  }
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  if (!query.code && query.redirect) {
    const redirect = Array.isArray(query.redirect) ? query.redirect[0] : query.redirect as string
    if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
      setCookie(event, 'oauth-redirect', redirect, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 300,
        path: '/'
      })
    }
  }
  return oauthHandler(event)
})
