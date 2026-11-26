import { toWebRequest } from 'h3'

/** Completes GitHub sign-in for Vercel previews (see `server/utils/auth-proxy.ts`). */
export default defineEventHandler(async (event) => {
  if (!useRuntimeConfig(event).oauthProxySecret || getRouterParam(event, 'provider') !== 'github') {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  const auth = await useAuthProxy()
  return auth.handler(toWebRequest(event))
})
