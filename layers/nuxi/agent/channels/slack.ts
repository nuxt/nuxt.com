import { connectSlackCredentials } from '@vercel/connect/eve'
import {
  defaultSlackAuth,
  slackChannel,
  type SlackContext,
  type SlackMessage
} from 'eve/channels/slack'
import { resolveSlackUserName } from '../lib/slack/api.js'
import { slackConnectorId } from '../lib/slack/connect.js'

function isHookConflictFailure(event: { code?: string, message?: string }) {
  const message = event.message ?? ''
  return event.code === 'HookConflictError'
    || message.includes('HookConflict')
    || message.includes('already in use by another workflow')
}

// Slack-specific behaviour lives in the always-on prompt, keyed on the
// principal (`lib/surface-instructions.ts`). Returning it as channel `context`
// would prepend a fresh copy to history on every mention.
//
// `app_mention`/`message` events only carry a user id, so resolve the real
// name here (cached) for `context.ts`'s `person.name`. Bots have none to look up.
async function dispatchSlackMessage(ctx: SlackContext, message: SlackMessage) {
  const auth = defaultSlackAuth(message, ctx)
  if (!auth) return null

  const userId = message.author?.userId
  if (!auth.attributes.full_name && userId && !message.author?.isBot) {
    const fullName = await resolveSlackUserName(userId)
    if (fullName) {
      return { auth: { ...auth, attributes: { ...auth.attributes, full_name: fullName } } }
    }
  }

  return { auth }
}

export default slackChannel({
  credentials: connectSlackCredentials(slackConnectorId()),
  botName: 'Nuxi',
  threadContext: { since: 'last-agent-reply' },
  onAppMention: dispatchSlackMessage,
  onDirectMessage: dispatchSlackMessage,
  events: {
    async 'session.failed'(event, _channel) {
      // DM + @mention (or any double dispatch on the same thread) races on one
      // continuation token — the winning run already handles the user message.
      if (isHookConflictFailure(event)) return

      await _channel.thread.post(
        'Something went wrong and I cannot continue in this thread. Start a new thread to try again.'
      )
    }
  }
})
