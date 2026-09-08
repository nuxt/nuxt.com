import { defineMcpClientConnection } from 'eve/connections'
import { connect, type EveAuthorizationOptions } from '@vercel/connect/eve'
import type { SessionContext } from 'eve/context'
import { isAdminMode } from '../lib/identity/admin-mode.js'

const VERCEL_TEAM_ID = process.env.NUXI_VERCEL_TEAM_ID
const VERCEL_PROJECT_ID = process.env.NUXI_VERCEL_PROJECT_ID

function adminOnlyVercelAuth(label: string, connectOptions: EveAuthorizationOptions) {
  return async (ctx: SessionContext) => {
    if (!(await isAdminMode(ctx.session.auth.current))) {
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

const ALLOWED_TOOLS = [
  'search_vercel_documentation',
  'search_vercel_endpoints',
  'call_vercel_endpoint',
  'get_runtime_logs',
  'get_runtime_errors',
  'list_agent_run_projects',
  'list_agent_runs',
  'get_agent_run'
] as const

export const VERCEL_MCP_INSTRUCTIONS = VERCEL_TEAM_ID && VERCEL_PROJECT_ID
  ? `**Vercel MCP connection (\`vercel-mcp__*\`, admin/Slack/schedule only) — read-only, use judiciously:**
- Discover exact schemas via \`connection_search\`, then call \`vercel-mcp__<tool>\`.
- Catalog: \`search_vercel_endpoints\` then \`call_vercel_endpoint\` with the returned endpoint id. **GET only** — never buy/deploy/mutate through this connection.
- Pre-scoped to the \`nuxt-js\` team / \`nuxt\` website project — \`teamId=${VERCEL_TEAM_ID}\`, \`projectId=${VERCEL_PROJECT_ID}\`. Pass both on every call.
- Traffic (production Web Analytics): \`GET /v1/query/web-analytics/visits/count\` for one total (\`visitors\` / \`pageviews\`); \`GET /v1/query/web-analytics/visits/aggregate\` for grouped rows (\`by\` + \`since\` + \`until\` required). Custom events: \`…/events/count\` and \`…/events/aggregate\`. \`filter\` is OData, e.g. \`requestPath eq '/docs'\`.
- Runtime: \`get_runtime_errors\` first, then \`get_runtime_logs\`.
- Nuxi's Agent Runs use the same \`teamId\` but a DIFFERENT \`projectId\` — the \`eve\` service, not the website. Call \`list_agent_run_projects\` first, then \`list_agent_runs\` / \`get_agent_run\`. Still NOT tokens/cost — use \`ai_gateway__*\`. Never fetch traces (\`get_agent_run_trace\` is not allowed).
- \`search_vercel_documentation\` needs no ids — general Vercel platform docs search.`
  : ''

export default defineMcpClientConnection({
  url: 'https://mcp.vercel.com/nuxt-js/nuxt',
  description: 'Vercel platform for nuxt.com: deployments, runtime logs/errors, web analytics, and Nuxi\'s own Agent Runs observability. Admin/Slack/schedule sessions only.',
  tools: { allow: ALLOWED_TOOLS },
  auth: adminOnlyVercelAuth('Vercel MCP', { connector: 'vercel/mcp', principalType: 'app', autoProvision: false })
})
