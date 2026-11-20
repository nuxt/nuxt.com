import { defineDynamic, defineInstructions } from 'eve/instructions'
import { callerInstructions } from '../lib/identity/caller-instructions.js'
import { resolveContext } from '../lib/identity/context.js'
import { surfaceInstructions } from '../lib/identity/surface-instructions.js'

/**
 * Resolved per turn, not per session. A Slack thread opened by a schedule anchors to that
 * session, so a human replying to a digest resumes it under the app principal — keyed on the
 * session they would inherit the schedule's empty surface block and lose the Slack rules. Turn
 * scope reads the auth that actually sent the message.
 */
export default defineDynamic((ctx) => {
  const context = resolveContext(ctx.session.auth.current)
  const content = [surfaceInstructions(context.surface), callerInstructions(context.person)]
    .filter(Boolean)
    .join('\n\n')
  return content ? defineInstructions({ content }) : null
})
