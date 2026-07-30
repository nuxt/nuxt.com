import { defineDynamic, defineInstructions } from 'eve/instructions'
import { ADMIN_MCP_INSTRUCTIONS } from './connections/admin-mcp.js'
import { AI_GATEWAY_INSTRUCTIONS } from './tools/ai-gateway.js'
import { VERCEL_MCP_INSTRUCTIONS } from './connections/vercel-mcp.js'
import { canAccessAdminMcp } from './lib/admin-mcp-access.js'
import { buildInstructionsWithDate } from './lib/base-instructions.js'
import { resolveSurface } from './lib/surface.js'
import { surfaceInstructions } from './lib/surface-instructions.js'

/**
 * Resolved per turn, not per session. A Slack thread opened by a schedule
 * anchors to that session, so a human replying to a digest resumes it under the
 * app principal — on `session.started` they would inherit the schedule's empty
 * surface block and lose the Slack formatting rules. Turn scope reads the auth
 * that actually sent the message.
 *
 * `turn.started` alone, never alongside `session.started`: eve keys the two
 * scopes separately and concatenates both, so declaring each would emit this
 * prompt twice. The output is stable within a session, so re-resolving costs a
 * string concat and does not disturb prompt caching.
 */
export default defineDynamic({
  events: {
    'turn.started': async (_event, ctx) => {
      const auth = ctx.session.auth.current
      const blocks = [buildInstructionsWithDate(), surfaceInstructions(resolveSurface(auth))]

      if (canAccessAdminMcp(auth)) {
        blocks.push(ADMIN_MCP_INSTRUCTIONS, VERCEL_MCP_INSTRUCTIONS, AI_GATEWAY_INSTRUCTIONS)
      }

      return defineInstructions({ markdown: blocks.filter(Boolean).join('\n\n') })
    }
  }
})
