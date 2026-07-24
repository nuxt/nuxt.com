import { connect, type EveAuthorizationOptions } from '@vercel/connect/eve'
import type { SessionContext } from 'eve/context'
import { canAccessAdminMcp } from './admin-mcp-access.js'

export const VERCEL_TEAM_ID = process.env.NUXI_VERCEL_TEAM_ID
export const VERCEL_PROJECT_ID = process.env.NUXI_VERCEL_PROJECT_ID

export function adminOnlyVercelAuth(label: string, connectOptions: EveAuthorizationOptions) {
  return (ctx: SessionContext) => {
    if (!canAccessAdminMcp(ctx.session.auth.current)) {
      return {
        principalType: 'app' as const,
        async getToken(): Promise<never> {
          console.warn(`[vercel-connect] blocked non-admin access to ${label}`)
          throw new Error('This tool is not available in the current session.')
        }
      }
    }

    return connect(connectOptions)
  }
}
