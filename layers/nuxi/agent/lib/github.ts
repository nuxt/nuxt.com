import type { ApprovalPolicy } from 'eve/tools/approval'
import { isAdminMode } from './identity/admin-mode.js'
import { resolveContext, type AuthContext, type Surface } from './identity/context.js'

/** The `nuxi-code` GitHub App on the nuxt org, connected to every environment of the project. */
export const GITHUB_CONNECTOR = 'github/nuxi-code'

const GITHUB_SURFACES = new Set<Surface>(['slack', 'discord', 'cli'])

/**
 * A human on Slack, someone in a `discord.channels.admin` channel, or `pnpm nuxi` with
 * `NUXI_CLI_ADMIN=1` to try it locally. `isAdminMode` decides within each surface.
 */
export async function canUseGithubTools(auth: AuthContext | null | undefined): Promise<boolean> {
  return GITHUB_SURFACES.has(resolveContext(auth).surface) && isAdminMode(auth)
}

/**
 * Agent-wide, so it also covers the coder subagent, which only these sessions are offered. A
 * second line of defense: anywhere else, every `github__*` call, read or write, is denied before
 * it reaches GitHub.
 */
export const githubToolsApproval: ApprovalPolicy = async ({ toolName, session }) => {
  if (!toolName.startsWith('github__')) return undefined
  if (await canUseGithubTools(session.auth.current)) return undefined
  return { type: 'denied', reason: 'GitHub tools are only available to the Nuxt team on Slack and in admin Discord channels.' }
}
