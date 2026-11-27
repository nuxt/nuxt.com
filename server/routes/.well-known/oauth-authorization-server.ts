import { oauthProviderAuthServerMetadata } from '@better-auth/oauth-provider'
import { defineHandler } from 'nuxt/server'

/**
 * RFC 8414 metadata of the admin MCP's authorization server (`mcp()` in `server/utils/auth.ts`).
 * Its issuer is the site origin, so the document lives at the root rather than under `/api/auth`.
 */
export default defineHandler(async (event) => {
  return oauthProviderAuthServerMetadata(await useAuth())(event.req)
})
