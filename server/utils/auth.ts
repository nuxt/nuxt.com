import type { H3Event } from 'h3'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { eq } from 'drizzle-orm'
import type { RequestEvent } from 'nuxt/server'
import { deriveSecret, sendRedirect as sendNuxtRedirect } from 'nuxt/server'

const LAST_SEEN_RESOLUTION_MS = 24 * 60 * 60 * 1000

/** Records account activity for the inactive-account sweep, at most once a day per account. */
async function touchLastSeen(userId: string) {
  const [row] = await db.select({ lastSeenAt: schema.users.lastSeenAt }).from(schema.users).where(eq(schema.users.id, userId)).limit(1)
  const now = new Date()
  if (row && (!row.lastSeenAt || now.getTime() - row.lastSeenAt.getTime() >= LAST_SEEN_RESOLUTION_MS)) {
    await db.update(schema.users).set({ lastSeenAt: now }).where(eq(schema.users.id, userId))
  }
}

async function createAuth() {
  const { oauth } = useRuntimeConfig()
  const discord = nuxtersDiscord.config()

  return betterAuth({
    secret: await deriveSecret('nuxt.com:better-auth'),
    basePath: '/api/auth',
    // Production, Vercel previews and local dev each sign in on their own host.
    baseURL: {
      allowedHosts: ['nuxt.com', '*-nuxt-js.vercel.app', 'localhost:*', ...(process.env.NUXT_DEV_ALLOWED_HOSTS?.split(',') ?? [])],
      fallback: 'https://nuxt.com'
    },
    database: drizzleAdapter(db, { provider: 'sqlite', schema }),
    advanced: { database: { generateId: 'uuid' } },
    user: {
      modelName: 'users',
      fields: { image: 'avatar' },
      additionalFields: {
        username: { type: 'string', required: true },
        provider: { type: 'string', required: true },
        providerId: { type: 'string', required: true },
        // Only the hooks below set it, from `isAuthorizedAdmin`.
        role: { type: 'string', required: true, defaultValue: 'user', input: false }
      }
    },
    session: {
      modelName: 'authSessions',
      // A deleted or demoted account keeps its session for up to this long.
      cookieCache: { enabled: true, maxAge: 5 * 60 }
    },
    account: {
      modelName: 'authAccounts',
      // Discord is linked to a signed-in GitHub account and asks for no email (see `server/api/auth/discord`).
      accountLinking: { trustedProviders: ['discord'], allowDifferentEmails: true }
    },
    verification: { modelName: 'authVerifications' },
    socialProviders: {
      github: {
        clientId: oauth.github.clientId,
        clientSecret: oauth.github.clientSecret,
        // Keeps the name, email, avatar and username in sync with GitHub on every sign-in.
        overrideUserInfoOnSignIn: true,
        mapProfileToUser: profile => ({
          avatar: profile.avatar_url,
          username: profile.login,
          provider: 'github',
          providerId: String(profile.id)
        })
      },
      ...(discord.enabled && {
        discord: {
          clientId: discord.clientId,
          clientSecret: discord.clientSecret,
          disableDefaultScope: true,
          scope: ['identify', 'guilds.join'],
          disableSignUp: true
        }
      })
    },
    // The site has no other way to sign in, and accounts are only deleted through `/api/account`.
    disabledPaths: ['/update-user', '/change-email', '/delete-user', '/sign-in/email', '/sign-up/email'],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === '/sign-in/social' && (ctx.body as { provider?: string } | undefined)?.provider !== 'github') {
          throw new APIError('BAD_REQUEST', { message: 'Sign in with GitHub' })
        }
      })
    },
    databaseHooks: {
      user: {
        // The admin role follows the Nuxt core team (or the admin allowlist) at every sign-in.
        create: {
          before: async user => ({ data: { ...user, role: await roleFor(user.username) } })
        },
        update: {
          before: async user => user.username ? { data: { ...user, role: await roleFor(user.username), lastSeenAt: new Date() } } : undefined
        }
      },
      session: {
        create: { after: session => touchLastSeen(session.userId) },
        update: { after: session => touchLastSeen(session.userId) }
      }
    }
  })
}

async function roleFor(username: unknown): Promise<AuthUser['role']> {
  return typeof username === 'string' && await isAuthorizedAdmin(username) ? 'admin' : 'user'
}

let instance: ReturnType<typeof createAuth> | undefined

/** The Better Auth instance. Created on first use: its secret is derived from `appSecret`. */
export function useAuth() {
  return (instance ??= createAuth())
}

export interface UserSession {
  user?: AuthUser
}

/** Routes built with `nuxt/server` and h3 routes both read the session. */
type SessionEvent = RequestEvent | H3Event

/** The request headers: a `nuxt/server` event carries the web request, an h3 event its own `headers`. */
function requestHeaders(event: SessionEvent): Headers {
  return event.req instanceof Request ? event.req.headers : (event as H3Event).headers
}

/** The signed-in user of the request, read from Better Auth's session cookie. */
export async function getUserSession(event: SessionEvent): Promise<UserSession> {
  const auth = await useAuth()
  const session = await auth.api.getSession({ headers: requestHeaders(event) })
  return session ? { user: toUser(session.user) } : {}
}

export async function requireUserSession(event: SessionEvent): Promise<Required<UserSession>> {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return session as Required<UserSession>
}

/** Signs out: removes the session and expires its cookies. */
export async function clearUserSession(event: H3Event) {
  const auth = await useAuth()
  const { headers } = await auth.api.signOut({ headers: event.headers, returnHeaders: true })
  for (const cookie of headers.getSetCookie()) {
    appendResponseHeader(event, 'set-cookie', cookie)
  }
}

/** Redirects to Better Auth's OAuth URL with the state cookies its API call set. */
export function redirectWithCookies(event: RequestEvent, headers: Headers, url: string) {
  for (const cookie of headers.getSetCookie()) {
    event.res.headers.append('set-cookie', cookie)
  }
  return sendNuxtRedirect(event, url)
}
