import { createDiscordAdapter, type DiscordAdapter } from '@chat-adapter/discord'
import { createMemoryState } from '@chat-adapter/state-memory'
import { createRedisState } from '@chat-adapter/state-redis'
import type { Message, Thread } from 'chat'
import { defineChannel } from 'eve/channels'
import { chatSdkChannel } from 'eve/channels/chat-sdk'
import {
  discordUserAuth,
  isAllowedDiscordChannel,
  isDiscordConfigured
} from '../lib/discord-access.js'
import { slackTextToDiscord } from '../lib/discord-format.js'

const DISCORD_CONTEXT = [
  'The user is talking to Nuxi on Discord, in a thread (like Slack).',
  '**Discord formatting:** Keep writing Slack mrkdwn (`<url|label>`, `:emoji:`) — outbound messages are converted to Discord markdown automatically. Use absolute nuxt.com links (`https://nuxt.com/docs/...`) — root-relative paths do not render as links. Never use `show_prompt` here. Keep replies compact — Discord plain messages are capped at 2000 characters (`@chat-adapter/discord` truncates longer content with `...`).'
]

type PostableMessage = string | { raw: string } | { markdown: string } | Record<string, unknown>

/**
 * Skills are Slack-first (`<url|label>`). Convert before the Discord adapter
 * posts/edits. Always emit `{ raw }` so the adapter skips its markdown AST
 * (which strips `<>` embed suppression).
 */
function convertPostableMessage(message: PostableMessage): PostableMessage {
  if (typeof message === 'string') {
    return { raw: slackTextToDiscord(message) }
  }
  if (!message || typeof message !== 'object') {
    return message
  }

  if ('markdown' in message && typeof message.markdown === 'string') {
    const { markdown, ...rest } = message
    return { ...rest, raw: slackTextToDiscord(markdown) }
  }
  if ('raw' in message && typeof message.raw === 'string') {
    return { ...message, raw: slackTextToDiscord(message.raw) }
  }
  return message
}

function withSlackMrkdwnConversion(adapter: DiscordAdapter): DiscordAdapter {
  const postMessage = adapter.postMessage.bind(adapter)
  const editMessage = adapter.editMessage.bind(adapter)
  const postChannelMessage = adapter.postChannelMessage?.bind(adapter)

  adapter.postMessage = async (threadId, message) =>
    postMessage(threadId, convertPostableMessage(message) as typeof message)
  adapter.editMessage = async (threadId, messageId, message) =>
    editMessage(threadId, messageId, convertPostableMessage(message) as typeof message)
  if (postChannelMessage) {
    adapter.postChannelMessage = async (channelId, message) =>
      postChannelMessage(channelId, convertPostableMessage(message) as typeof message)
  }
  return adapter
}

const THREAD_TITLE_MAX_LENGTH = 90

function shouldDispatch(thread: Thread, message: Message): boolean {
  if (message.author.isMe || message.author.isBot === true) return false
  const allowed = isAllowedDiscordChannel(thread.channelId)
  if (!allowed) {
    console.warn('[nuxi:discord] dropped mention: channel not in DISCORD_ALLOWED_CHANNELS', { channelId: thread.channelId })
  }
  return allowed
}

function threadTitleFromMessage(text: string): string | undefined {
  const cleaned = text.replace(/<@[!&]?\d+>/g, '').replace(/\s+/g, ' ').trim()
  if (!cleaned) return undefined
  return cleaned.length > THREAD_TITLE_MAX_LENGTH
    ? `${cleaned.slice(0, THREAD_TITLE_MAX_LENGTH).trimEnd()}…`
    : cleaned
}

function createDiscordBridge() {
  // Durable state needs Redis in production — memory does not survive across
  // serverless invocations, so overlapping Gateway windows would double-dispatch.
  const redisUrl = process.env.REDIS_URL?.trim()
  if (!redisUrl && process.env.VERCEL_ENV === 'production') {
    throw new Error('[nuxi:discord] REDIS_URL is required in production for durable Chat SDK state')
  }

  const discordAdapter = createDiscordAdapter()
  /** Unwrapped post — digest mirror converts + splits once, then posts here. */
  const postChannelMessageRaw = discordAdapter.postChannelMessage.bind(discordAdapter)

  const bridge = chatSdkChannel({
    userName: 'Nuxi',
    adapters: {
      discord: withSlackMrkdwnConversion(discordAdapter)
    },
    state: redisUrl ? createRedisState() : createMemoryState(),
    // Keep the Discord principal when a HITL button click resumes a session.
    resolveInputAuth: event => discordUserAuth(event.user?.userId, event.user?.userName, event.thread?.channelId)
  })

  const { bot, send } = bridge

  bot.onNewMention(async (thread: Thread, message: Message) => {
    if (!shouldDispatch(thread, message)) return
    await thread.subscribe()

    const title = threadTitleFromMessage(message.text)
    if (title) {
      void bot.getAdapter('discord')?.setThreadTitle(thread.id, title)
        .catch((error: unknown) => console.warn('[nuxi:discord] setThreadTitle failed', error))
    }

    await send(
      { message: message.text, context: DISCORD_CONTEXT },
      { thread, auth: discordUserAuth(message.author.userId, message.author.userName, thread.channelId) }
    )
  })

  bot.onSubscribedMessage(async (thread: Thread, message: Message) => {
    if (!shouldDispatch(thread, message)) return
    await send(
      { message: message.text, context: DISCORD_CONTEXT },
      { thread, auth: discordUserAuth(message.author.userId, message.author.userName, thread.channelId) }
    )
  })

  return {
    bot,
    channel: bridge.channel,
    send,
    async postWorkflowParts(channelId: string, parts: string[]) {
      // Chat SDK channel id shape: `discord:<guild>:<channel>` (`_` guild is fine for channel posts).
      const sdkChannelId = `discord:_:${channelId}`
      for (const part of parts) {
        await postChannelMessageRaw(sdkChannelId, { raw: part })
      }
    }
  }
}

type DiscordBridge = ReturnType<typeof createDiscordBridge>

const discordBridge: DiscordBridge | null = isDiscordConfigured()
  ? createDiscordBridge()
  : (console.warn('[nuxi:discord] Discord env not set — channel disabled'), null)

export const bot = discordBridge?.bot ?? null
export const send = discordBridge?.send ?? null
export const channel = discordBridge?.channel ?? defineChannel({ routes: [] })

/**
 * Post already-converted Discord markdown to a channel (no thread), skipping
 * the live Slack→Discord wrapper so digests are not converted twice.
 */
export async function postDiscordWorkflowParts(channelId: string, parts: string[]): Promise<void> {
  if (!discordBridge) {
    throw new Error('[nuxi:discord] Discord is not configured')
  }
  await discordBridge.postWorkflowParts(channelId, parts)
}

export default channel
