import { defineMcpClientConnection } from 'eve/connections'
import { connect, type EveAuthorizationOptions } from '@vercel/connect/eve'
import type { SessionContext } from 'eve/context'
import { isAdminMode } from '../lib/identity/admin-mode.js'

const VERCEL_TEAM_ID = process.env.NUXI_VERCEL_TEAM_ID
const VERCEL_PROJECT_ID = process.env.NUXI_VERCEL_PROJECT_ID
const VERCEL_NUXT_UI_PROJECT_ID = process.env.NUXI_VERCEL_NUXT_UI_PROJECT_ID

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
- Catalog: \`search_vercel_endpoints\` then \`call_vercel_endpoint\` with the returned endpoint id. Use GET endpoints plus the read-only \`POST /v2/observability/query\` only — never buy, deploy, or mutate through this connection.
- Pre-scoped to the \`nuxt-js\` team (\`teamId=${VERCEL_TEAM_ID}\`). For website analytics/runtime only, also pass \`projectId=${VERCEL_PROJECT_ID}\` (the \`nuxt\` site).
- Traffic (production Web Analytics): \`GET /v1/query/web-analytics/visits/count\` for one total (\`visitors\` / \`pageviews\`); \`GET /v1/query/web-analytics/visits/aggregate\` for grouped rows (\`by\` + \`since\` + \`until\` required). Custom events: \`…/events/count\` and \`…/events/aggregate\`. \`filter\` is OData, e.g. \`requestPath eq '/docs'\`.
- Agent-facing HTTP usage (includes CDN/static requests that Web Analytics misses): call \`POST /v2/observability/query\` with \`metric='vercel.request.count'\`, \`aggregation='sum'\`, ISO \`startTime\` / \`endTime\`, and \`scope={ type: 'project', ownerId: '${VERCEL_TEAM_ID}', projectIds: ['<project id>'] }\`. Use Nuxt project \`${VERCEL_PROJECT_ID}\`${VERCEL_NUXT_UI_PROJECT_ID ? ` or Nuxt UI project \`${VERCEL_NUXT_UI_PROJECT_ID}\`` : '; Nuxt UI metrics are unavailable until `NUXI_VERCEL_NUXT_UI_PROJECT_ID` is configured'}.
- MCP transport: filter \`request_path eq '/mcp' and environment eq 'production'\`. Raw content: \`endswith(request_path, '.md')\`. Negotiated Markdown: \`contains(http_accept, 'text/markdown')\`. Agent discovery/intake paths: \`/llms.txt\`, \`/llms-full.txt\`, \`/sitemap.md\`, \`/openapi.json\`, and \`/.well-known/mcp/server-card.json\`. Useful groupings: \`client_user_agent\`, \`bot_category\`, \`bot_name\`, \`request_path\`, \`request_method\`, \`http_status\`, \`content_type\`.
- Be precise: \`vercel.request.count\` counts HTTP requests, not logical MCP tool calls or unique agents. One MCP session performs initialization, discovery, tool calls, retries, and notifications. A \`.md\` path or \`curl/*\` user agent alone does not prove AI usage: humans can use “View as Markdown” / “Copy page”, and scripts use curl. Treat explicit \`Accept: text/markdown\`, known AI bot categories/names, and POST \`/mcp\` as stronger signals. Web Analytics is browser-oriented and must not be used to estimate curl, MCP, or raw Markdown traffic.
- Runtime: \`get_runtime_errors\` first, then \`get_runtime_logs\`.
- Nuxi's Agent Runs use the same \`teamId\` but a DIFFERENT \`projectId\` — the \`eve\` service, not the website. Call \`list_agent_run_projects\` first and use that id on \`list_agent_runs\` / \`get_agent_run\`. Still NOT tokens/cost — use \`ai_gateway__*\`. Never fetch traces (\`get_agent_run_trace\` is not allowed).
- \`search_vercel_documentation\` needs no ids — general Vercel platform docs search.`
  : ''

export default defineMcpClientConnection({
  url: 'https://mcp.vercel.com/nuxt-js/nuxt',
  description: 'Vercel platform for nuxt.com: deployments, runtime logs/errors, web analytics, and Nuxi\'s own Agent Runs observability. Admin/Slack/schedule sessions only.',
  tools: { allow: ALLOWED_TOOLS },
  auth: adminOnlyVercelAuth('Vercel MCP', { connector: 'vercel/mcp', principalType: 'app', autoProvision: false })
})
