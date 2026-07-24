import { createDiscordAdapter } from '@chat-adapter/discord'
import { createMemoryState } from '@chat-adapter/state-memory'
import { createRedisState } from '@chat-adapter/state-redis'
import type { Message, Thread } from 'chat'
import { chatSdkChannel } from 'eve/channels/chat-sdk'
import { discordUserAuth, isAllowedDiscordChannel } from '../lib/discord-access.js'

const DISCORD_CONTEXT = [
  'The user is talking to Nuxi on Discord, in a thread (like Slack).',
  '**Discord formatting:** Use absolute nuxt.com links (`https://nuxt.com/docs/...`) — root-relative paths do not render as links on Discord. Standard Unicode emojis only (no Slack custom emojis). Never use `show_prompt` here. Keep replies compact — Discord splits messages over 2000 characters.'
]

/**
 * Discord runs through the Chat SDK channel (mention-driven, replies in
 * threads) instead of eve's native interactions-only channel, so Nuxi behaves
 * like it does on Slack: @mention it in an allowed channel, it answers in a
 * thread, and follow-ups in that thread continue the same eve session.
 *
 * Regular messages reach us through the Discord Gateway listener kept alive by
 * `schedules/discord-gateway.ts`, which forwards events to this channel's
 * webhook at `/eve/v1/discord`.
 */
// Durable state (thread subscriptions, dedupe, locks) needs Redis in
// production — memory state doesn't survive across serverless invocations, so
// silently falling back to it in prod would drop dedupe/locking and let the
// Gateway's overlapping listener windows double-dispatch. Memory is fine for
// local dev and previews.
const redisUrl = process.env.REDIS_URL?.trim()
if (!redisUrl && process.env.VERCEL_ENV === 'production') {
  throw new Error('[nuxi:discord] REDIS_URL is required in production for durable Chat SDK state')
}

export const { bot, channel, send } = chatSdkChannel({
  userName: 'Nuxi',
  adapters: {
    // Credentials resolve from DISCORD_BOT_TOKEN, DISCORD_PUBLIC_KEY and
    // DISCORD_APPLICATION_ID env vars on the eve service.
    discord: createDiscordAdapter()
  },
  state: redisUrl ? createRedisState() : createMemoryState(),
  // Keep the Discord principal when a HITL button click resumes a session.
  // Pass the action's own thread channel (not the allowlist gate below,
  // which only runs for onNewMention/onSubscribedMessage) so a resume from
  // an unlisted channel doesn't inherit admin access.
  resolveInputAuth: event => discordUserAuth(event.user?.userId, event.user?.userName, event.thread?.channelId)
})

const THREAD_TITLE_MAX_LENGTH = 90

function shouldDispatch(thread: Thread, message: Message): boolean {
  if (message.author.isMe || message.author.isBot === true) return false
  // Allowlist gate: `thread.channelId` is always the parent Discord channel,
  // even for messages inside threads. Discord sessions are admin-enabled
  // (see admin-mcp-access.ts) — this gate is what makes that safe.
  const allowed = isAllowedDiscordChannel(thread.channelId)
  if (!allowed) {
    console.warn('[nuxi:discord] dropped mention: channel not in DISCORD_ALLOWED_CHANNELS', { channelId: thread.channelId })
  }
  return allowed
}

// `message.text` is Discord's raw content, so a mention still contains the
// `<@applicationId>` token — strip it before using the text as a thread title.
function threadTitleFromMessage(text: string): string | undefined {
  const cleaned = text.replace(/<@[!&]?\d+>/g, '').replace(/\s+/g, ' ').trim()
  if (!cleaned) return undefined
  return cleaned.length > THREAD_TITLE_MAX_LENGTH
    ? `${cleaned.slice(0, THREAD_TITLE_MAX_LENGTH).trimEnd()}…`
    : cleaned
}

bot.onNewMention(async (thread: Thread, message: Message) => {
  if (!shouldDispatch(thread, message)) return
  await thread.subscribe()

  // Fire-and-forget: rename the thread from Discord's default ("Thread 7/23/2026…")
  // without delaying the reply.
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
    { message: message.text },
    { thread, auth: discordUserAuth(message.author.userId, message.author.userName, thread.channelId) }
  )
})

export default channel
