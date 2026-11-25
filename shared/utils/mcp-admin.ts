/**
 * Public origin of the admin MCP's OAuth server, and the resource its tokens are bound to.
 * The web service and the Nuxi agent (`eve` service) must agree on both, so they share this.
 * Previews use the branch URL rather than the per-deployment `VERCEL_URL`, so a Vercel
 * Connect grant keeps working across deployments of the same branch.
 */
export function mcpOAuthIssuer(): string {
  if (process.env.VERCEL_ENV === 'production') return 'https://nuxt.com'
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_BRANCH_URL) {
    return `https://${process.env.VERCEL_BRANCH_URL}`
  }
  return process.env.NUXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '') || 'http://localhost:3000'
}

export function mcpAdminResource(): string {
  return `${mcpOAuthIssuer()}/mcp/admin`
}

export const MCP_OAUTH_SCOPES = {
  'admin:analytics': 'Read docs feedback, agent usage and votes, Google Search Console and Core Web Vitals data',
  'admin:chats': 'Read web chat transcripts shared with admins or made public',
  'admin:templates': 'Read template check results and start template checks on Vercel Sandbox'
} as const

export type McpOAuthScope = keyof typeof MCP_OAUTH_SCOPES

export const MCP_OAUTH_SCOPE_LIST = Object.keys(MCP_OAUTH_SCOPES) as McpOAuthScope[]
