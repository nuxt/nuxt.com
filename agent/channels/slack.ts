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

async function dispatchSlackMessage(ctx: SlackContext, message: SlackMessage) {
  await ctx.thread.startTyping('Thinking...')

  const auth = defaultSlackAuth(message, ctx)
  if (!auth) return null

  const context = ['The user is talking to Nuxi on Slack.']

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
    async 'session.failed'(event, channel) {
      if (isHookConflictFailure(event)) {
        await channel.thread.post(
          'I\'m still working on your previous message in this thread — wait for my reply, or start a new thread if you need a separate conversation.'
        )
        return
      }

      await channel.thread.post(
        'Something went wrong and I cannot continue in this thread. Start a new thread to try again.'
      )
    }
  }
})
