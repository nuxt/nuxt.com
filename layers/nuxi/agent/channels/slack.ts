import { connectSlackCredentials } from '@vercel/connect/eve'
import {
  defaultSlackAuth,
  loadThreadContextMessages,
  slackChannel,
  type SlackContext,
  type SlackMessage
} from 'eve/channels/slack'

function isHookConflictFailure(event: { code?: string, message?: string }) {
  const message = event.message ?? ''
  return event.code === 'HookConflictError'
    || message.includes('HookConflict')
    || message.includes('already in use by another workflow')
}

const SLACK_EMOJI_GUIDANCE = `**Slack emojis:** When it fits, use our workspace custom emojis (sparingly — 0–2 per message) instead of generic Unicode emoji: :nuxter: (Nuxt logo), :nuxt-intensifies:, :nuxt_lurk:, :nuxt_cool:, :nuxi:. Examples: :nuxter: or :nuxi: for greetings or Nuxt pride; :nuxt_cool: when something works; :nuxt-intensifies: for excitement; :nuxt_lurk: while investigating. Use Slack :colon: syntax exactly as written.`

async function dispatchSlackMessage(ctx: SlackContext, message: SlackMessage) {
  await ctx.thread.startTyping('Thinking...')

  const auth = defaultSlackAuth(message, ctx)
  if (!auth) return null

  const context = [
    'The user is talking to Nuxi on Slack.',
    SLACK_EMOJI_GUIDANCE
  ]

  const prior = await loadThreadContextMessages(ctx.thread, message, {
    since: 'last-agent-reply'
  })

  if (prior.length > 0) {
    const transcript = prior
      .map(m => `${m.isMe ? 'you' : (m.user ?? 'user')}: ${m.markdown}`)
      .join('\n')
    context.push(`Recent thread messages since your last reply:\n\n${transcript}`)
  }

  return { auth, context }
}

export default slackChannel({
  credentials: connectSlackCredentials(
    process.env.SLACK_CONNECTOR ?? 'slack/nuxi'
  ),
  botName: 'Nuxi',
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
