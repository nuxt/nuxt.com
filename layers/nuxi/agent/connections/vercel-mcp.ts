import { connect } from '@vercel/connect/eve'
import { defineMcpClientConnection } from 'eve/connections'
import { canAccessAdminMcp } from '../lib/admin-mcp-access.js'

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
  'get_agent_run',
  'get_agent_run_trace'
] as const

export const VERCEL_MCP_INSTRUCTIONS = `**Vercel MCP connection (\`connection__vercel_mcp__*\`, admin/Slack/schedule only) — read-only, use judiciously:**
- Discover exact schemas via \`connection__search\`, then call \`connection__vercel_mcp__<tool>\`.
- The connection is pre-scoped to the \`nuxt-js\` team and the \`nuxt\` (nuxt.com website) project — \`teamId=team_zU0ZdJxp3qZNP8KV915v81x9\`, \`projectId=prj_IoobJ3tM612A7AS5Ozc0cVPPjmDC\`. Pass both explicitly to \`list_deployments\`, \`get_deployment\`, \`get_deployment_build_logs\`, \`get_runtime_logs\`, \`get_runtime_errors\`, \`get_project\`.
- Nuxi's own Agent Runs (\`list_agent_runs\`, \`get_agent_run\`, \`get_agent_run_trace\`) use the same \`teamId\` but a DIFFERENT \`projectId\` — the \`eve\` service's own project, not the website. Call \`list_agent_run_projects\` first to discover it. Still NOT tokens/cost — use AI Gateway for that.
- \`search_vercel_documentation\` needs no ids — general Vercel platform docs search.`

export default defineMcpClientConnection({
  url: 'https://mcp.vercel.com/nuxt-js/nuxt',
  description: 'Vercel platform for nuxt.com: deployments, runtime logs/errors, and Nuxi\'s own Agent Runs observability. Admin/Slack/schedule sessions only.',
  tools: { allow: ALLOWED_TOOLS },
  auth: (ctx) => {
    if (!canAccessAdminMcp(ctx.session.auth.current)) {
      return {
        principalType: 'app' as const,
        async getToken(): Promise<never> {
          throw new Error('Vercel MCP is restricted to Nuxi admins.')
        }
      }
    }

    return connect({
      connector: 'vercel/mcp',
      principalType: 'app',
      autoProvision: false
    })
  }
})
