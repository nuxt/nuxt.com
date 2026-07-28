import { defineMcpClientConnection } from 'eve/connections'
import type { SessionContext } from 'eve/context'
import { canAccessAdminMcp } from '../lib/admin-mcp-access.js'
import { appOrigin } from '../lib/internal-api.js'

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
- \`admin-mcp__list-agent-chats\` / \`admin-mcp__get-agent-chat\` — saved web chat sessions and transcripts
- \`admin-mcp__list-agent-votes\` — message upvotes/downvotes
- For runs, Slack / Discord / web, duration: **Vercel Agent Runs** via \`vercel-mcp__*\` (see below)
- For tokens, cost, model usage: **AI Gateway** via \`ai_gateway__*\` (see below)
- Do not invent token/cost numbers from local DB.
- Default to recent data (last 7–30 days) unless the user asks for a longer window
- Always include direct links (path / chat id) so the team can drill down on nuxt.com`

/**
 * Mirrors `adminOnlyVercelAuth`: a non-admin session still sees the connection
 * in `connection_search`, but every call fails before reaching the server.
 */
function adminOnlyToken(ctx: SessionContext) {
  if (!canAccessAdminMcp(ctx.session.auth.current)) {
    return {
      principalType: 'app' as const,
      async getToken(): Promise<never> {
        console.warn('[nuxi:admin-mcp] blocked non-admin access')
        throw new Error('This tool is not available in the current session.')
      }
    }
  }

  return {
    principalType: 'app' as const,
    async getToken() {
      const token = process.env.NUXT_MCP_ADMIN_TOKEN?.trim()
      if (!token) throw new Error('NUXT_MCP_ADMIN_TOKEN is not configured')
      return { token }
    }
  }
}

export default defineMcpClientConnection({
  url: `${appOrigin()}/mcp/admin`,
  description: 'Nuxi admin analytics: docs feedback ratings, saved web chat transcripts, and per-message votes. Admin/Slack/Discord/schedule sessions only.',
  tools: { allow: ALLOWED_TOOLS },
  auth: adminOnlyToken
})
