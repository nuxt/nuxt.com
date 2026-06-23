import { connectSlackCredentials } from '@vercel/connect/eve'
import {
  defaultSlackAuth,
  loadThreadContextMessages,
  slackChannel,
  type SlackContext,
  type SlackMessage
} from 'eve/channels/slack'

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
  onDirectMessage: dispatchSlackMessage
})
