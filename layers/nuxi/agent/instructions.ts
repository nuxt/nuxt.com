import { defineDynamic, defineInstructions } from 'eve/instructions'
import { ADMIN_MCP_INSTRUCTIONS } from './connections/admin-mcp.js'
import { AI_GATEWAY_INSTRUCTIONS } from './tools/ai-gateway.js'
import { VERCEL_MCP_INSTRUCTIONS } from './connections/vercel-mcp.js'
import { canAccessAdminMcp } from './lib/admin-mcp-access.js'
import { buildInstructionsWithDate } from './lib/base-instructions.js'

export default defineDynamic({
  events: {
    'session.started': async (_event, ctx) => {
      const auth = ctx.session.auth.current
      const markdown = canAccessAdminMcp(auth)
        ? [buildInstructionsWithDate(), ADMIN_MCP_INSTRUCTIONS, VERCEL_MCP_INSTRUCTIONS, AI_GATEWAY_INSTRUCTIONS].filter(Boolean).join('\n\n')
        : buildInstructionsWithDate()

      return defineInstructions({ markdown })
    }
  }
})
