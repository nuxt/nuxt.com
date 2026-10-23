import { defineMcpClientConnection } from 'eve/connections'
import { connect } from '@vercel/connect/eve'
import type { SessionContext } from 'eve/context'
import { isAdminMode } from '../lib/identity/admin-mode.js'

const ARTIFACTS_MCP_URL = 'https://nuxt-artifacts.vercel.app/mcp'

/** `delete-artifact-version` is permanent, so it stays out of reach. */
const ALLOWED_TOOLS = [
  'prepare-publishing',
  'get-component-contracts',
  'list-artifacts',
  'read-artifact',
  'create-artifact',
  'update-artifact',
  'update-artifact-settings',
  'promote-artifact-version'
] as const

export const ARTIFACTS_MCP_INSTRUCTIONS = `**Nuxt Artifacts connection (\`artifacts-mcp__*\`, team only):**
- Team workspace at https://nuxt-artifacts.vercel.app for versioned Markdown artifacts: reports, research, plans, specs, comparisons. Artifacts you create are owned by Nuxi.
- Use it when a team member asks to save, share, or publish a result. Discover exact schemas via \`connection_search\`, then call \`artifacts-mcp__<tool>\`.
- Always call \`prepare-publishing\` before \`create-artifact\` or \`update-artifact\`; use \`get-component-contracts\` for exact component props.
- To edit an existing artifact, find it with \`list-artifacts\` and \`read-artifact\` first, then \`update-artifact\`. Never create a duplicate.
- Always reply with the artifact link. Do not change visibility unless asked.`

/** Same gating as `vercel-mcp`: visible in `connection_search`, but calls fail outside admin sessions. */
async function adminOnlyArtifactsAuth(ctx: SessionContext) {
  if (!(await isAdminMode(ctx.session.auth.current))) {
    return {
      principalType: 'app' as const,
      async getToken(): Promise<never> {
        console.warn('[nuxi:artifacts-mcp] blocked non-admin access')
        throw new Error('This tool is not available in the current session.')
      }
    }
  }

  return connect({
    connector: 'nuxt-artifacts.vercel.app/nuxi',
    principalType: 'app',
    autoProvision: false,
    // Without a resource, Artifacts issues an opaque token that /mcp rejects with 401.
    tokenParams: { resources: [ARTIFACTS_MCP_URL] }
  })
}

export default defineMcpClientConnection({
  url: ARTIFACTS_MCP_URL,
  description: 'Nuxt Artifacts: publish, read, and update versioned Markdown artifacts (reports, research, plans, specs) in the team workspace. Admin/Slack/Discord/schedule sessions only.',
  tools: { allow: ALLOWED_TOOLS },
  auth: adminOnlyArtifactsAuth
})
