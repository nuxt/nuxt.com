import { defineDynamic, defineInstructions } from 'eve/instructions'
import { ADMIN_MCP_INSTRUCTIONS } from './connections/admin-mcp.js'
import { AI_GATEWAY_INSTRUCTIONS } from './tools/ai-gateway.js'
import { VERCEL_MCP_INSTRUCTIONS } from './connections/vercel-mcp.js'
import { canAccessAdminMcp } from './lib/admin-mcp-access.js'
import { buildInstructionsWithDate } from './lib/base-instructions.js'
import { resolveSurface } from './lib/surface.js'
import { surfaceInstructions } from './lib/surface-instructions.js'

export default defineDynamic({
  events: {
    'session.started': async (_event, ctx) => {
      const auth = ctx.session.auth.current
      const blocks = [buildInstructionsWithDate(), surfaceInstructions(resolveSurface(auth))]

      if (canAccessAdminMcp(auth)) {
        blocks.push(ADMIN_MCP_INSTRUCTIONS, VERCEL_MCP_INSTRUCTIONS, AI_GATEWAY_INSTRUCTIONS)
      }

      return defineInstructions({ markdown: blocks.filter(Boolean).join('\n\n') })
    }
  }
})
