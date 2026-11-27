import type { H3Event } from 'h3'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError, createAuthMiddleware, getSessionFromCtx } from 'better-auth/api'
import { jwt } from 'better-auth/plugins'
import { cimd } from '@better-auth/cimd'
import { fetchClientMetadataResource } from '@better-auth/cimd/node'
import { mcp } from '@better-auth/mcp'
import { and, eq } from 'drizzle-orm'
import type { RequestEvent } from 'nuxt/server'
import { deriveSecret, sendRedirect as sendNuxtRedirect } from 'nuxt/server'
import { MCP_OAUTH_SCOPE_LIST, mcpAdminResource, mcpOAuthIssuer } from '../../shared/utils/mcp-admin'

const LAST_SEEN_RESOLUTION_MS = 24 * 60 * 60 * 1000

/** Records account activity for the inactive-account sweep, at most once a day per account. */
async function touchLastSeen(userId: string) {
  const [row] = await db.select({ lastSeenAt: schema.users.lastSeenAt }).from(schema.users).where(eq(schema.users.id, userId)).limit(1)
  const now = new Date()
  if (row && (!row.lastSeenAt || now.getTime() - row.lastSeenAt.getTime() >= LAST_SEEN_RESOLUTION_MS)) {
    await db.update(schema.users).set({ lastSeenAt: now }).where(eq(schema.users.id, userId))
  }
}

/**
 * Fetches client metadata documents and keys like `@better-auth/cimd/node`, but drops the custom-scheme
 * redirect URIs without a path that Better Auth refuses (`raycast://mcp-oauth-callback`). Better Auth
 * rejects a whole document for one of them, which locks out clients such as Raycast that redirect to
 * another URI they list. The transport, and its SSRF guarantees, stay Better Auth's.
 */
const fetchClientMetadata: typeof fetchClientMetadataResource = async (input, init) => {
  const response = await fetchClientMetadataResource(input, init)
  if (response.status !== 200) return response
  const document = await response.clone().json().catch(() => undefined) as { client_id?: unknown, redirect_uris?: unknown } | undefined
  if (document?.client_id !== String(input) || !Array.isArray(document.redirect_uris)) return response
  const redirectUris = document.redirect_uris.filter((uri) => {
    try {
      const { protocol, pathname } = new URL(uri)
      return protocol === 'http:' || protocol === 'https:' || pathname !== ''
    } catch {
      return true
    }
  })
  if (redirectUris.length === document.redirect_uris.length || !redirectUris.length) return response
  const headers = new Headers(response.headers)
  headers.delete('content-length')
  headers.delete('content-encoding')
  return new Response(JSON.stringify({ ...document, redirect_uris: redirectUris }), { status: 200, headers })
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
    advanced: {
      database: { generateId: 'uuid' },
      // Vercel ends TLS before the app, so the request URL is `http://`. It sets `x-forwarded-proto`
      // and `x-forwarded-host` itself, and the host is still checked against `allowedHosts`.
      trustedProxyHeaders: true
    },
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
    disabledPaths: [
      // The site has no other way to sign in, and accounts are only deleted through `/api/account`.
      '/update-user', '/change-email', '/delete-user', '/sign-in/email', '/sign-up/email',
      // Session JWTs share the access tokens' signing key, so the `jwt` plugin must not hand them out.
      '/token',
      // MCP clients register themselves (CIMD or dynamic registration); nobody manages clients by hand.
      '/oauth2/create-client', '/oauth2/get-client', '/oauth2/get-clients', '/oauth2/update-client',
      '/oauth2/delete-client', '/oauth2/client/rotate-secret'
    ],
    plugins: [
      jwt({
        disableSettingJwtHeader: true,
        // The site origin, not the per-request `baseURL`: tokens and discovery stay the same on every
        // host of a deployment, and the toolkit verifies them against it (`server/mcp-admin/index.ts`).
        jwt: { issuer: mcpOAuthIssuer() },
        schema: { jwks: { modelName: 'authJwks' } }
      }),
      // The admin MCP's authorization server: people approve MCP clients on `/oauth/authorize` after
      // signing in with GitHub, and only admins can approve (see `hooks` below).
      mcp({
        resource: mcpAdminResource(),
        loginPage: '/login',
        consentPage: '/oauth/authorize',
        // Better Auth only issues a refresh token when `offline_access` is granted.
        scopes: ['offline_access', ...MCP_OAUTH_SCOPE_LIST],
        // Every token acts for a person who approved it.
        grantTypes: ['authorization_code', 'refresh_token'],
        // Short-lived, because revoking a client can't reach access tokens already issued.
        accessTokenExpiresIn: 15 * 60,
        // Most MCP clients still register dynamically; CIMD (below) is the preferred path.
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
        clientRegistrationDefaultApplicationType: 'infer',
        clientRegistrationDefaultScopes: ['offline_access', ...MCP_OAUTH_SCOPE_LIST],
        schema: {
          oauthClient: { modelName: 'authOauthClients' },
          oauthResource: { modelName: 'authOauthResources' },
          oauthClientResource: { modelName: 'authOauthClientResources' },
          oauthRefreshToken: { modelName: 'authOauthRefreshTokens' },
          oauthAccessToken: { modelName: 'authOauthAccessTokens' },
          oauthConsent: { modelName: 'authOauthConsents' },
          oauthClientAssertion: { modelName: 'authOauthClientAssertions' }
        }
      }),
      // Client ID Metadata Documents, including `private_key_jwt` clients such as Nuxi through Vercel Connect.
      cimd({ fetchClientMetadataResource: fetchClientMetadata })
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === '/sign-in/social' && (ctx.body as { provider?: string } | undefined)?.provider !== 'github') {
          throw new APIError('BAD_REQUEST', { message: 'Sign in with GitHub' })
        }
        if (ctx.path === '/oauth2/consent' && (ctx.body as { accept?: boolean } | undefined)?.accept === true) {
          const session = await getSessionFromCtx(ctx)
          if (!session || !await isAdmin(session.user as { role?: string, username?: string })) {
            throw new APIError('FORBIDDEN', { message: 'Admin access required' })
          }
        }
        // Better Auth deletes only the consent: without this, the client keeps refreshing its tokens.
        if (ctx.path === '/oauth2/delete-consent') {
          const session = await getSessionFromCtx(ctx)
          const id = (ctx.body as { id?: unknown } | undefined)?.id
          if (session && typeof id === 'string') await revokeMcpClientTokens(session.user.id, id)
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

async function isAdmin(user: { role?: string, username?: string }) {
  return user.role === 'admin' && typeof user.username === 'string' && await isAuthorizedAdmin(user.username)
}

/** Whether the user behind an admin MCP access token (`sub`) is still an admin. */
export async function isMcpAdmin(userId: string) {
  const [user] = await db.select({ role: schema.users.role, username: schema.users.username }).from(schema.users).where(eq(schema.users.id, userId)).limit(1)
  return !!user && await isAdmin(user)
}

/**
 * Deletes the refresh tokens a user granted to the client of one of their consents (its stored
 * access tokens go with them). Access tokens are JWTs, so those already issued run until they expire.
 */
async function revokeMcpClientTokens(userId: string, consentId: string) {
  const { authOauthConsents: consents, authOauthRefreshTokens: tokens } = schema
  const [consent] = await db.select({ clientId: consents.clientId }).from(consents)
    .where(and(eq(consents.id, consentId), eq(consents.userId, userId))).limit(1)
  if (consent) {
    await db.delete(tokens).where(and(eq(tokens.clientId, consent.clientId), eq(tokens.userId, userId)))
  }
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

/**
 * The request headers. On Nuxt 4 a `nuxt/server` event is a Proxy over the h3 event: only `req`, `res`
 * and `url` are its own, so `headers` is h3's for both kinds. With Nitro v3 this becomes `event.req.headers`.
 */
function requestHeaders(event: SessionEvent): Headers {
  return (event as H3Event).headers
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
