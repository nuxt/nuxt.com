import { openCodeChannel } from 'eve/channels/slack'
import { defineDynamic, defineTool } from 'eve/tools'
import { z } from 'zod'
import slack from '../channels/slack.js'
import { canUseGithubTools } from '../lib/github.js'
import { resolveContext } from '../lib/identity/context.js'

// Slack only, for the people who can use the `coder` subagent: a code channel is where its coding
// work happens, one channel and one session per task.
export default defineDynamic(async (ctx) => {
  const auth = ctx.session.auth.current
  if (resolveContext(auth).surface !== 'slack') return null
  if (!(await ctx.memo(ctx.turn?.id ?? null, () => canUseGithubTools(auth)))) return null

  return defineTool({
    description: [
      'Move this Slack conversation into a new code channel before handing a coding task on nuxt.com to `coder`, such as a fix, a feature, or an investigation with long output.',
      'Answer in place when one message answers the request. Call it once per request; Slack links the new channel here and invites the person who asked, so afterward reply in one short sentence at most and continue the work in the channel.',
      'If it returns unavailable, such as when this already is a code channel, or Slack refuses, continue here and quote the reason without guessing its cause. Don\'t call it again for the same request, but do when the person asks you to try again, since the Slack setup may have changed.'
    ].join(' '),
    inputSchema: z.object({
      message: z.string().describe('The task and where to start. The channel sees the conversation so far.'),
      name: z.string().max(80).describe('A short title, such as `Fix the useFetch example`.')
    }),
    async execute({ message, name }, toolCtx) {
      return await openCodeChannel(toolCtx, slack, message, { name })
    }
  })
})
