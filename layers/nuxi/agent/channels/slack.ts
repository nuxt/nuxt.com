import { connectSlackCredentials } from '@vercel/connect/eve'
import {
  defaultSlackAuth,
  slackChannel,
  type SlackContext,
  type SlackMessage
} from 'eve/channels/slack'
import { slackConnectorId } from '../lib/slack-connect.js'

function isHookConflictFailure(event: { code?: string, message?: string }) {
  const message = event.message ?? ''
  return event.code === 'HookConflictError'
    || message.includes('HookConflict')
    || message.includes('already in use by another workflow')
}

const SLACK_CONTEXT = [
  'The user is talking to Nuxi on Slack.',
  '**Slack emojis:** When it fits, use our workspace custom emojis (sparingly — 0–2 per message) instead of generic Unicode emoji: :nuxter: (Nuxt logo), :nuxt-intensifies:, :nuxt_lurk:, :nuxt_cool:, :nuxi:. Examples: :nuxter: or :nuxi: for greetings or Nuxt pride; :nuxt_cool: when something works; :nuxt-intensifies: for excitement; :nuxt_lurk: while investigating. Use Slack :colon: syntax exactly as written.'
]

function dispatchSlackMessage(ctx: SlackContext, message: SlackMessage) {
  const auth = defaultSlackAuth(message, ctx)
  if (!auth) return null
  return { auth, context: SLACK_CONTEXT }
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
