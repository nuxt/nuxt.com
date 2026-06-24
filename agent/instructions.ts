import { defineDynamic, defineInstructions } from 'eve/instructions'
import { ADMIN_MCP_INSTRUCTIONS, canAccessAdminMcp } from './tools/admin-mcp.js'
import { buildInstructionsWithDate } from './lib/base-instructions.js'

export default defineDynamic({
  events: {
    'session.started': async (_event, ctx) => {
      const auth = ctx.session.auth.current
      const markdown = canAccessAdminMcp(auth)
        ? `${buildInstructionsWithDate()}\n\n${ADMIN_MCP_INSTRUCTIONS}`
        : buildInstructionsWithDate()

      return defineInstructions({ markdown })
    }
  }
})
