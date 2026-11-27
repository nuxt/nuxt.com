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

/** Admin tools available to Nuxi; keep the surface explicit. */
const ALLOWED_TOOLS = [
  'feedback-stats',
  'list-feedback',
  'agent-usage-stats',
  'list-agent-chats',
  'get-agent-chat',
  'list-agent-votes',
  'search-console-analytics',
  'search-console-inspect-url',
  'search-console-sitemaps',
  'page-head',
  'crux-web-vitals',
  'start-template-checks',
  'template-check-status'
] as const

export const ADMIN_MCP_INSTRUCTIONS = `**Admin MCP connection (\`admin-mcp__*\`, current session authorized):**
- Admin mode is enabled for this turn, including when using an opted-in local CLI. Use the tools below when the user requests them.
- Discover exact schemas via \`eve__search\`, then call the discovered tool through \`eve__tool\`.
- \`admin-mcp__feedback-stats\` — aggregated docs feedback metrics
- \`admin-mcp__list-feedback\` — individual feedback entries
- \`admin-mcp__agent-usage-stats\` — web chat counts and vote quality (NOT tokens/cost — use \`vercel-mcp__*\` for runs, \`ai_gateway__*\` for tokens/cost)
- \`admin-mcp__list-agent-chats\` / \`admin-mcp__get-agent-chat\` — web chats shared with admins or made public, and their transcripts (private chats are excluded)
- \`admin-mcp__list-agent-votes\` — message upvotes/downvotes on those same chats
- \`admin-mcp__search-console-analytics\` — Google Search clicks, impressions, CTR (percentage), and average position; data lags 2–3 days. Pass explicit inclusive dates for equal-length comparisons. Ungrouped queries (\`dimensions=[]\`) give totals; grouped rows are partial, never sum them into site totals.
- \`admin-mcp__search-console-inspect-url\` / \`admin-mcp__search-console-sitemaps\` — indexing, canonical and sitemap diagnostics
- \`admin-mcp__page-head\` — the live redirects, status, title, meta description, canonical and robots of one page on nuxt.com or a subdomain; no page content
- \`admin-mcp__crux-web-vitals\` — field performance over rolling 28-day periods; origin fallback is not page-level evidence
- For search performance and concrete SEO recommendations, load the \`seo-opportunities\` skill. For new showcase candidates from nuxt.fyi, load \`showcase-discovery\`.
- When a team member says something on nuxt.com is broken or not working (a template, page, API route, feature or Nuxi answer), load the \`debug-nuxt-com\` skill before answering or asking them for details.
- \`admin-mcp__template-check-status\` — which templates pass or fail the daily check, at which step and why (\`includeLog\`)
- \`admin-mcp__start-template-checks\` — re-check templates on Vercel Sandbox (\`slugs\` or \`failing\`). Each one costs a sandbox for up to 15 minutes: never check every template unless asked. It returns right away; follow it with \`template-check-status\`
- An empty \`template-check-status\` result means there is no recorded check history for that query. It does not mean the template is missing or that starting a check is unavailable.
- When asked to build a template, discover and call \`start-template-checks\` with that template’s slug, even if its check history is empty. If the user has not identified a specific template, ask which one; “Nuxt UI template” can refer to several templates. Never turn an ambiguous request into a check of every template.
- For runs, Slack / Discord / web, duration: **Vercel Agent Runs** via \`vercel-mcp__*\` (see below)
- For tokens, cost, model usage: **AI Gateway** via \`ai_gateway__*\` (see below)
- Do not invent token/cost numbers from local DB.
- Default to recent data (last 7–30 days) unless the user asks for a longer window
- Always include direct links (path / chat id) so the team can drill down on nuxt.com`

/**
 * Mirrors `adminOnlyVercelAuth`: a non-admin session still sees the connection
 * in `eve__search`, but every call fails before reaching the server.
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
  // once through nuxt.com's GitHub consent page, and Connect refreshes the grant from there (`offline_access`).
  return connect({
    connector: 'nuxt.com/nuxi',
    principalType: 'app',
    autoProvision: true,
    // nuxt.com only issues tokens bound to this exact resource (RFC 8707), and rejects Connect's default `*` scope.
    tokenParams: { resources: [ADMIN_MCP_URL], scopes: ['offline_access', ...MCP_OAUTH_SCOPE_LIST] }
  })
}

export default defineMcpClientConnection({
  url: ADMIN_MCP_URL,
  description: 'Nuxi admin analytics: docs feedback, shared web chats and votes, Google Search Console performance/indexing/sitemaps, live page redirects and metadata, CrUX Core Web Vitals, and template checks. Requires admin mode, including opted-in local CLI sessions.',
  tools: { allow: ALLOWED_TOOLS },
  auth: adminOnlyConnect
})
