import { defineMcpClientConnection } from 'eve/connections'
import { connect } from '@vercel/connect/eve'
import type { SessionContext } from 'eve/context'
import { MCP_OAUTH_SCOPE_LIST } from '../../../../shared/utils/mcp-admin.js'
import { isAdminMode } from '../lib/identity/admin-mode.js'

/**
 * Always production, also from local dev and previews: Vercel Connect calls the
 * server itself, so it can't reach localhost or a preview behind Vercel Authentication.
 */
const ADMIN_MCP_URL = 'https://nuxt.com/mcp/admin'

/** The admin MCP server exposes exactly these; keep the surface explicit. */
const ALLOWED_TOOLS = [
  'feedback-stats',
  'list-feedback',
  'agent-usage-stats',
  'list-agent-chats',
  'get-agent-chat',
  'list-agent-votes'
] as const

export const ADMIN_MCP_INSTRUCTIONS = `**Admin MCP connection (\`admin-mcp__*\`, team only):**
- Discover exact schemas via \`connection_search\`, then call \`admin-mcp__<tool>\`.
- \`admin-mcp__feedback-stats\` — aggregated docs feedback metrics
- \`admin-mcp__list-feedback\` — individual feedback entries
- \`admin-mcp__agent-usage-stats\` — web chat counts and vote quality (NOT tokens/cost — use \`vercel-mcp__*\` for runs, \`ai_gateway__*\` for tokens/cost)
- \`admin-mcp__list-agent-chats\` / \`admin-mcp__get-agent-chat\` — web chats shared with admins or made public, and their transcripts (private chats are excluded)
- \`admin-mcp__list-agent-votes\` — message upvotes/downvotes on those same chats
- For runs, Slack / Discord / web, duration: **Vercel Agent Runs** via \`vercel-mcp__*\` (see below)
- For tokens, cost, model usage: **AI Gateway** via \`ai_gateway__*\` (see below)
- Do not invent token/cost numbers from local DB.
- Default to recent data (last 7–30 days) unless the user asks for a longer window
- Always include direct links (path / chat id) so the team can drill down on nuxt.com`

/**
 * Mirrors `adminOnlyVercelAuth`: a non-admin session still sees the connection
 * in `connection_search`, but every call fails before reaching the server.
 */
async function adminOnlyConnect(ctx: SessionContext) {
  if (!(await isAdminMode(ctx.session.auth.current))) {
    return {
      principalType: 'app' as const,
      async getToken(): Promise<never> {
        console.warn('[nuxi:admin-mcp] blocked non-admin access')
        throw new Error('This tool is not available in the current session.')
      }
    }
  }

  // Connect creates the `nuxt.com/nuxi` connector on first use; an admin then installs it
  // once through nuxt.com's GitHub consent page, and Connect refreshes the grant from there.
  return connect({
    connector: 'nuxt.com/nuxi',
    principalType: 'app',
    autoProvision: true,
    // nuxt.com only issues tokens bound to this exact resource (RFC 8707), and rejects Connect's default `*` scope.
    tokenParams: { resources: [ADMIN_MCP_URL], scopes: [...MCP_OAUTH_SCOPE_LIST] }
  })
}

export default defineMcpClientConnection({
  url: ADMIN_MCP_URL,
  description: 'Nuxi admin analytics: docs feedback ratings, shared web chat transcripts, and per-message votes. Admin/Slack/Discord/schedule sessions only.',
  tools: { allow: ALLOWED_TOOLS },
  auth: adminOnlyConnect
})
