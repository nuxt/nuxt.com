import { connectSlackCredentials } from '@vercel/connect/eve'
import {
  defaultSlackAuth,
  loadThreadContextMessages,
  slackChannel,
  type SlackContext,
  type SlackEventContext,
  type SlackMessage
} from 'eve/channels/slack'
import { buildSlackPromptCard, buildSlackPromptFallbackText } from '../lib/slack-prompt-card.js'
import { buildSlackPromptDeeplinks, parsePromptCardOutput } from '../../shared/utils/ide-deeplinks.js'

interface PendingSlackPromptCard {
  description: string
  prompt: string
  repo?: string
}

/** Post the IDE card after the turn's text reply (turn.completed), not on action.result. */
const pendingPromptCards = new Map<string, PendingSlackPromptCard>()

async function postSlackPromptCard(channel: SlackEventContext, data: PendingSlackPromptCard) {
  const deeplinks = buildSlackPromptDeeplinks(data.prompt, data.repo)
  const cardPayload = { description: data.description, prompt: data.prompt, deeplinks }

  try {
    await channel.thread.post({
      card: buildSlackPromptCard(cardPayload),
      fallbackText: buildSlackPromptFallbackText(cardPayload)
    })
  } catch (error) {
    console.error('[nuxi/slack] show_prompt card post failed', error)
    await channel.thread.post({
      markdown: buildSlackPromptFallbackText(cardPayload)
    })
  }
}

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
    async 'action.result'(eventData) {
      if (eventData.status !== 'completed') return

      const { result } = eventData
      if (result.kind !== 'tool-result' || result.isError || result.toolName !== 'show_prompt') {
        return
      }

      const data = parsePromptCardOutput(result.output)
      if (!data) return

      pendingPromptCards.set(eventData.turnId, {
        description: data.description,
        prompt: data.prompt,
        repo: data.repo
      })
    },
    async 'turn.completed'(eventData, channel) {
      const pending = pendingPromptCards.get(eventData.turnId)
      if (!pending) return
      pendingPromptCards.delete(eventData.turnId)
      await postSlackPromptCard(channel, pending)
    },
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
