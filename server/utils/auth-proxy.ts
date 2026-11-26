import { betterAuth } from 'better-auth'
import { memoryAdapter } from 'better-auth/adapters/memory'
import { oAuthProxy } from 'better-auth/plugins'
import { deriveSecret } from 'nuxt/server'

/**
 * GitHub's half of preview sign-in, ahead of the move to Better Auth (#2696).
 *
 * Every Vercel preview has its own host, which no GitHub OAuth app can list as its callback. Previews running Better
 * Auth's `oAuthProxy` send GitHub to `https://nuxt.com/api/auth/callback/github` with production's client ID. This
 * instance exchanges the code and hands the profile, encrypted with `NUXT_OAUTH_PROXY_SECRET`, back to the preview,
 * which creates the session in its own database. It never stores a user or session, so it needs no tables.
 * Sign-in on this site still goes through nuxt-auth-utils.
 */
async function createAuthProxy() {
  const { oauth, oauthProxySecret } = useRuntimeConfig()
  return betterAuth({
    secret: await deriveSecret('nuxt.com:better-auth'),
    baseURL: 'https://nuxt.com',
    basePath: '/api/auth',
    database: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    socialProviders: {
      github: { clientId: oauth.github.clientId, clientSecret: oauth.github.clientSecret }
    },
    plugins: [oAuthProxy({ productionURL: 'https://nuxt.com', secret: oauthProxySecret })]
  })
}

let instance: ReturnType<typeof createAuthProxy> | undefined

export function useAuthProxy() {
  return (instance ??= createAuthProxy())
}
