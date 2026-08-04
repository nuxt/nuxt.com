import { defineMcpClientConnection } from 'eve/connections'
import { connect, type EveAuthorizationOptions } from '@vercel/connect/eve'
import type { SessionContext } from 'eve/context'
import { isAdminMode } from '../lib/admin-mode.js'

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
  'list_deployments',
  'get_deployment',
  'get_deployment_build_logs',
  'get_runtime_logs',
  'get_runtime_errors',
  'get_project',
  'list_agent_run_projects',
  'list_agent_runs',
  'get_web_analytics'
] as const

export const VERCEL_MCP_INSTRUCTIONS = VERCEL_TEAM_ID && VERCEL_PROJECT_ID
  ? `**Vercel MCP connection (\`vercel-mcp__*\`, admin/Slack/schedule only) — read-only, use judiciously:**
- Discover exact schemas via \`connection_search\`, then call \`vercel-mcp__<tool>\`.
- The connection is pre-scoped to the \`nuxt-js\` team and the \`nuxt\` (nuxt.com website) project — \`teamId=${VERCEL_TEAM_ID}\`, \`projectId=${VERCEL_PROJECT_ID}\`. Pass both explicitly to \`list_deployments\`, \`get_deployment\`, \`get_deployment_build_logs\`, \`get_runtime_logs\`, \`get_runtime_errors\`, \`get_project\`, \`get_web_analytics\`.
- Nuxi's own Agent Runs (\`list_agent_runs\`) use the same \`teamId\` but a DIFFERENT \`projectId\` — the \`eve\` service's own project, not the website. Call \`list_agent_run_projects\` first to discover it. Still NOT tokens/cost — use \`ai_gateway__*\` for that. No per-run trace access — this connection only exposes run-level metadata, never raw conversation content.
- \`get_web_analytics\` (visitors/pageviews/custom events, production only): \`mode: 'count'\` (default) returns one total, e.g. "how many visitors this week"; \`mode: 'aggregate'\` groups by up to two \`by\` dimensions (hour/day/week/month/year, country, route, requestPath, referrerHostname, deviceType, browserName, eventName, flags/<name>, ...) and requires \`since\`+\`until\`. \`dataset: 'visits'\` (default) for pageviews, \`'events'\` for custom \`track()\` events. \`filter\` is OData, e.g. \`requestPath eq '/docs'\`. Requires Web Analytics enabled on the project.
- \`search_vercel_documentation\` needs no ids — general Vercel platform docs search.`
  : ''

export default defineMcpClientConnection({
  url: 'https://mcp.vercel.com/nuxt-js/nuxt',
  description: 'Vercel platform for nuxt.com: deployments, runtime logs/errors, web analytics, and Nuxi\'s own Agent Runs observability. Admin/Slack/schedule sessions only.',
  tools: { allow: ALLOWED_TOOLS },
  auth: adminOnlyVercelAuth('Vercel MCP', { connector: 'vercel/mcp', principalType: 'app', autoProvision: false })
})
