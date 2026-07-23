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
export const { bot, channel, send } = chatSdkChannel({
  userName: 'Nuxi',
  adapters: {
    // Credentials resolve from DISCORD_BOT_TOKEN, DISCORD_PUBLIC_KEY and
    // DISCORD_APPLICATION_ID env vars on the eve service.
    discord: createDiscordAdapter()
  },
  // Durable state (thread subscriptions, dedupe, locks) needs Redis in
  // production; memory is fine for local dev.
  state: process.env.REDIS_URL ? createRedisState() : createMemoryState(),
  // Keep the Discord principal when a HITL button click resumes a session.
  resolveInputAuth: event => discordUserAuth(event.user?.userId, event.user?.userName)
})

function shouldDispatch(thread: Thread, message: Message): boolean {
  if (message.author.isMe || message.author.isBot === true) return false
  // Allowlist gate: `thread.channelId` is always the parent Discord channel,
  // even for messages inside threads. Discord sessions are admin-enabled
  // (see admin-mcp-access.ts) — this gate is what makes that safe.
  const allowed = isAllowedDiscordChannel(thread.channelId)
  console.log('[nuxi:discord]', allowed ? 'dispatching' : 'dropped (channel not in DISCORD_ALLOWED_CHANNELS)', {
    channelId: thread.channelId,
    threadId: thread.id,
    author: message.author.userName
  })
  return allowed
}

bot.onNewMention(async (thread: Thread, message: Message) => {
  if (!shouldDispatch(thread, message)) return
  await thread.subscribe()
  await send(
    { message: message.text, context: DISCORD_CONTEXT },
    { thread, auth: discordUserAuth(message.author.userId, message.author.userName) }
  )
})

bot.onSubscribedMessage(async (thread: Thread, message: Message) => {
  if (!shouldDispatch(thread, message)) return
  await send(
    { message: message.text },
    { thread, auth: discordUserAuth(message.author.userId, message.author.userName) }
  )
})

export default channel
