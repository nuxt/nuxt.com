import { isScheduleAppAuth, type AdminMcpAuthContext } from './admin-mcp-access.js'

export type Surface = 'web' | 'slack' | 'discord' | 'schedule' | 'unknown'

/**
 * The Chat SDK bridge reports `chat-sdk` as its channel kind, which does not
 * distinguish adapters, so the surface comes from the authenticated principal
 * instead — the same discriminants `canAccessAdminMcp` relies on.
 *
 * Kept free of channel imports on purpose: both the gateway tags and the
 * dynamic instructions resolve a surface, and neither should drag
 * `channels/slack.ts` (and Vercel Connect with it) into its import graph.
 */
export function resolveSurface(auth: AdminMcpAuthContext | null | undefined): Surface {
  if (!auth) return 'unknown'
  if (isScheduleAppAuth(auth)) return 'schedule'

  const issuer = auth.issuer ?? ''
  if (issuer.startsWith('slack')) return 'slack'
  if (issuer.startsWith('discord')) return 'discord'
  if (issuer === 'nuxt.com') return 'web'
  return 'unknown'
}
