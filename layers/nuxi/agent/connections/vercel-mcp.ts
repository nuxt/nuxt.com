import { defineMcpClientConnection } from 'eve/connections'
import { adminOnlyVercelAuth, VERCEL_PROJECT_ID, VERCEL_TEAM_ID } from '../lib/vercel-connect.js'

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
- The connection is pre-scoped to the \`nuxt-js\` team and the \`nuxt\` (nuxt.com website) project — \`teamId=${VERCEL_TEAM_ID}\`, \`projectId=${VERCEL_PROJECT_ID}\`. Pass both explicitly to \`list_deployments\`, \`get_deployment\`, \`get_deployment_build_logs\`, \`get_runtime_logs\`, \`get_runtime_errors\`, \`get_project\`.
- Nuxi's own Agent Runs (\`list_agent_runs\`, \`get_agent_run\`, \`get_agent_run_trace\`) use the same \`teamId\` but a DIFFERENT \`projectId\` — the \`eve\` service's own project, not the website. Call \`list_agent_run_projects\` first to discover it. Still NOT tokens/cost — use \`ai_gateway__*\` for that.
- \`search_vercel_documentation\` needs no ids — general Vercel platform docs search.`

export default defineMcpClientConnection({
  url: 'https://mcp.vercel.com/nuxt-js/nuxt',
  description: 'Vercel platform for nuxt.com: deployments, runtime logs/errors, and Nuxi\'s own Agent Runs observability. Admin/Slack/schedule sessions only.',
  tools: { allow: ALLOWED_TOOLS },
  auth: adminOnlyVercelAuth('Vercel MCP', { connector: 'vercel/mcp', principalType: 'app', autoProvision: false })
})
