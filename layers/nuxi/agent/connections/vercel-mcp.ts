import { getTokenResponse } from '@vercel/connect'
import { defineMcpClientConnection } from 'eve/connections'
import { canAccessAdminMcp } from '../lib/admin-mcp-access.js'

// Read-only subset of https://mcp.vercel.com's tools. Excludes everything
// that mutates (deploy_to_vercel, buy_*, domain purchases, toolbar threads)
// and discovery tools we don't need (list_teams, list_projects, get_project —
// see VERCEL_MCP_INSTRUCTIONS for the fixed team/project ids instead).
const ALLOWED_TOOLS = [
  'search_vercel_documentation',
  'list_deployments',
  'get_deployment',
  'get_deployment_build_logs',
  'get_runtime_logs',
  'get_runtime_errors',
  'list_agent_run_projects',
  'list_agent_runs',
  'get_agent_run',
  'get_agent_run_trace'
] as const

export const VERCEL_MCP_INSTRUCTIONS = `**Vercel MCP connection (\`connection__vercel_mcp__*\`, admin/Slack/schedule only) — acts with Hugo's personal Vercel access, use judiciously:**
- Discover exact schemas via \`connection__search\`, then call \`connection__vercel_mcp__<tool>\`.
- nuxt.com website: \`teamId=team_zU0ZdJxp3qZNP8KV915v81x9\`, \`projectId=prj_IoobJ3tM612A7AS5Ozc0cVPPjmDC\` — pass both explicitly to \`list_deployments\`, \`get_deployment\`, \`get_deployment_build_logs\`, \`get_runtime_logs\`, \`get_runtime_errors\`.
- Nuxi's own Agent Runs (\`list_agent_runs\`, \`get_agent_run\`, \`get_agent_run_trace\`) use the same \`teamId\` but a DIFFERENT \`projectId\` — the \`eve\` service's own project, not the website. Call \`list_agent_run_projects\` first to discover it. Still NOT tokens/cost — use AI Gateway for that.
- \`search_vercel_documentation\` needs no ids — general Vercel platform docs search.`

export default defineMcpClientConnection({
  url: 'https://mcp.vercel.com',
  description: 'Vercel platform for nuxt.com: deployments, runtime logs/errors, and Nuxi\'s own Agent Runs observability. Acts with Hugo\'s personal Vercel access — admin/Slack/schedule sessions only.',
  tools: { allow: ALLOWED_TOOLS },
  auth: async (ctx) => {
    if (!canAccessAdminMcp(ctx.session.auth.current)) {
      return {
        async getToken() {
          throw new Error('Vercel MCP is restricted to Nuxi admins.')
        }
      }
    }

    return {
      async getToken() {
        const response = await getTokenResponse('mcp.vercel.com/nuxi-vercel', { subject: { type: 'user', id: 'nuxi-admin' }, scopes: ['*'] })
        return { token: response.token, expiresAt: response.expiresAt }
      }
    }
  }
})
