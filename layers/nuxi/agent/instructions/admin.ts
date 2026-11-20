import { defineDynamic, defineInstructions } from 'eve/instructions'
import { ADMIN_MCP_INSTRUCTIONS } from '../connections/admin-mcp.js'
import { ARTIFACTS_MCP_INSTRUCTIONS } from '../connections/artifacts-mcp.js'
import { VERCEL_MCP_INSTRUCTIONS } from '../connections/vercel-mcp.js'
import { isAdminMode } from '../lib/identity/admin-mode.js'
import { AI_GATEWAY_INSTRUCTIONS } from '../tools/ai-gateway.js'

/**
 * Only when the current turn is authorized. Memoized per turn: on Discord, `isAdminMode` reads
 * Global Config, and eve runs this before every model call.
 */
export default defineDynamic(async (ctx) => {
  const admin = await ctx.memo(ctx.turn?.id ?? null, () => isAdminMode(ctx.session.auth.current))
  if (!admin) return null
  const content = [ADMIN_MCP_INSTRUCTIONS, VERCEL_MCP_INSTRUCTIONS, AI_GATEWAY_INSTRUCTIONS, ARTIFACTS_MCP_INSTRUCTIONS]
    .filter(Boolean)
    .join('\n\n')
  return defineInstructions({ content })
})
