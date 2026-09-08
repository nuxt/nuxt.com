import { createDiscordAdapter, type DiscordAdapter } from '@chat-adapter/discord'
import { createMemoryState } from '@chat-adapter/state-memory'
import { createRedisState } from '@chat-adapter/state-redis'
import type { UserContent } from 'ai'
import type { Message, MessageContext, Thread } from 'chat'
import { defineChannel } from 'eve/channels'
import {
  chatSdkChannel,
  isNotImplemented,
  messageToUserContent,
  type ChatSdkChannelState,
  type ChatSdkEventContext
} from 'eve/channels/chat-sdk'
import {
  discordUserAuth,
  isAllowedDiscordChannel,
  isAutoRespondDiscordChannel,
  isDiscordConfigured
} from '../lib/discord/access.js'
import { slackTextToDiscord, splitDiscordMessages } from '../lib/discord/format.js'
import { withDiscordRetry } from '../lib/discord/retry.js'

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

/**
 * Retries at the adapter level rather than per call site, so eve's own streamed
 * posts and edits are covered too — they never pass through the helpers below.
 * Mutates in place, like `withSlackMrkdwnConversion`, so it has to run before
 * any method is bound off the adapter.
 */
function withRateLimitRetry(adapter: DiscordAdapter): DiscordAdapter {
  const postMessage = adapter.postMessage.bind(adapter)
  const editMessage = adapter.editMessage.bind(adapter)
  const postChannelMessage = adapter.postChannelMessage?.bind(adapter)

  adapter.postMessage = async (threadId, message) =>
    withDiscordRetry('postMessage', () => postMessage(threadId, message))
  adapter.editMessage = async (threadId, messageId, message) =>
    withDiscordRetry('editMessage', () => editMessage(threadId, messageId, message))
  if (postChannelMessage) {
    adapter.postChannelMessage = async (channelId, message) =>
      withDiscordRetry('postChannelMessage', () => postChannelMessage(channelId, message))
  }
  return adapter
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

/** Mirror of eve's internal `clearStream` so the next step opens a fresh anchor. */
function clearStream(state: ChatSdkChannelState): void {
  state.anchorMessageId = null
  state.streamStepIndex = null
  state.lastEditAtMs = null
}

/** eve surfaces this as the typing status while tools run. */
function firstNonEmptyLine(text: string): string | null {
  return text.split('\n').map(line => line.trim()).find(Boolean) ?? null
}

const THREAD_TITLE_MAX_LENGTH = 90

function isHuman(message: Message): boolean {
  return !message.author.isMe && message.author.isBot !== true
}

async function shouldDispatch(thread: Thread, message: Message): Promise<boolean> {
  if (!isHuman(message)) return false
  const allowed = await isAllowedDiscordChannel(thread.channelId)
  if (!allowed) {
    console.warn('[nuxi:discord] dropped message: channel not in discord.channels', { channelId: thread.channelId })
  }
  return allowed
}

/** Gates `onNewMessage` below: only `discord.channels.autoRespond` answers without an `@mention`. */
async function shouldAutoRespond(thread: Thread, message: Message): Promise<boolean> {
  if (!isHuman(message)) return false
  return isAutoRespondDiscordChannel(thread.channelId)
}

/**
 * The `queue` concurrency strategy dispatches the newest message and hands the
 * ones that arrived mid-turn over as `context.skipped`, oldest first. Answering
 * only the newest would silently drop the rest of the user's turn.
 */
function burstMessages(message: Message, context: MessageContext | undefined): Message[] {
  const skipped = context?.skipped.filter(isHuman) ?? []
  return [...skipped, message]
}

/**
 * Folds a burst into one model input. `messageToUserContent` turns each
 * attachment into a file part, so an error screenshot posted on Discord reaches
 * the model instead of being reduced to its (often empty) message text.
 */
function toUserContent(messages: readonly Message[]): string | UserContent {
  const text = messages.map(message => message.text.trim()).filter(Boolean).join('\n\n')
  const files = messages.flatMap((message) => {
    const content = messageToUserContent(message)
    return Array.isArray(content) ? content.filter(part => part.type !== 'text') : []
  })

  if (files.length === 0) return text
  return text ? [{ type: 'text' as const, text }, ...files] : files
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

  const discordAdapter = withRateLimitRetry(createDiscordAdapter())
  // Unwrapped posts — the digest mirror and `finalizeDiscordMessage` convert +
  // split once, so they must not go through the live conversion wrapper added
  // below. Bound here, they keep the retry and skip only the conversion.
  const postChannelMessageRaw = discordAdapter.postChannelMessage.bind(discordAdapter)
  const postMessageRaw = discordAdapter.postMessage.bind(discordAdapter)
  const editMessageRaw = discordAdapter.editMessage.bind(discordAdapter)

  /**
   * Replaces eve's `finalizeStreamedMessage`, which hands the whole assistant
   * message to `adapter.editMessage` — `@chat-adapter/discord` then truncates
   * past 2000 chars and digests lost their tail. Reuse the stream anchor for the
   * first chunk and post the rest as follow-ups.
   */
  async function finalizeDiscordMessage(
    channel: ChatSdkEventContext<{ discord: DiscordAdapter }>,
    text: string,
    postWithoutAnchor: boolean
  ): Promise<void> {
    const thread = channel.thread
    const [firstPart, ...overflowParts] = splitDiscordMessages(slackTextToDiscord(text))
    if (!thread || !firstPart) {
      clearStream(channel.state)
      return
    }

    const anchorId = channel.state.anchorMessageId
    let delivered = false
    if (anchorId && channel.state.editSupported !== false) {
      try {
        await editMessageRaw(thread.id, anchorId, { raw: firstPart })
        delivered = true
      } catch (error) {
        if (!isNotImplemented(error)) throw error
        channel.state.editSupported = false
      }
    }
    if (!delivered) {
      if (!postWithoutAnchor) {
        clearStream(channel.state)
        return
      }
      await postMessageRaw(thread.id, { raw: firstPart })
    }

    for (const part of overflowParts) {
      await postMessageRaw(thread.id, { raw: part })
    }
    clearStream(channel.state)
  }

  const bridge = chatSdkChannel({
    userName: 'Nuxi',
    adapters: {
      discord: withSlackMrkdwnConversion(discordAdapter)
    },
    state: redisUrl ? createRedisState() : createMemoryState(),
    // Chat SDK defaults to `drop`: a message sent while a turn is still running
    // is discarded with a LockError and the user never gets an answer. `queue`
    // holds them instead (see `burstMessages`). Not `burst`, which would delay
    // even a lone message by its debounce window.
    concurrency: 'queue',
    // Keep the Discord principal when a HITL button click resumes a session.
    resolveInputAuth: event => discordUserAuth(event.user?.userId, event.user?.userName, event.user?.fullName, event.thread?.channelId),
    events: {
      // Same shape as eve's default handler, only the delivery is chunked.
      async 'message.completed'(event, channel) {
        if (event.finishReason === 'tool-calls') {
          channel.state.pendingToolCallMessage = event.message ? firstNonEmptyLine(event.message) : null
          if (event.message) await finalizeDiscordMessage(channel, event.message, false)
          else clearStream(channel.state)
          return
        }

        channel.state.pendingToolCallMessage = null
        if (!event.message) {
          clearStream(channel.state)
          return
        }
        await finalizeDiscordMessage(channel, event.message, true)
      }
    }
  })

  const { bot, send } = bridge

  /**
   * Subscribes to a freshly opened thread and sends its first turn to the model.
   * Shared by `onNewMention` (renames the thread from the mention text) and
   * `onNewMessage` (a Forum post already has its own title — never renamed).
   */
  async function dispatchNewThread(
    thread: Thread,
    message: Message,
    context: MessageContext | undefined,
    { renameThread }: { renameThread: boolean }
  ): Promise<void> {
    await thread.subscribe()

    const turn = burstMessages(message, context)
    if (renameThread) {
      // Title from the mention that opened the thread, not the newest message.
      const title = threadTitleFromMessage(turn[0]?.text ?? message.text)
      if (title) {
        void bot.getAdapter('discord')?.setThreadTitle(thread.id, title)
          .catch((error: unknown) => console.warn('[nuxi:discord] setThreadTitle failed', error))
      }
    }

    // Discord-specific behaviour lives in the always-on prompt, keyed on the
    // principal (`lib/surface-instructions.ts`) — passing it as `context` here
    // would prepend a fresh copy to history on every message.
    await send(
      toUserContent(turn),
      { thread, auth: discordUserAuth(message.author.userId, message.author.userName, message.author.fullName, thread.channelId) }
    )
  }

  bot.onNewMention(async (thread: Thread, message: Message, context?: MessageContext) => {
    if (!(await shouldDispatch(thread, message))) return
    await dispatchNewThread(thread, message, context, { renameThread: true })
  })

  // No `@mention` required — gated to `discord.channels.autoRespond` (e.g. a Forum
  // channel where every "New Post" is its own thread). Mutually exclusive with
  // `onNewMention`: the Chat SDK routes a message to exactly one of the two.
  bot.onNewMessage(/[\s\S]*/, async (thread: Thread, message: Message, context?: MessageContext) => {
    if (!(await shouldAutoRespond(thread, message))) return
    await dispatchNewThread(thread, message, context, { renameThread: false })
  })

  bot.onSubscribedMessage(async (thread: Thread, message: Message, context?: MessageContext) => {
    if (!(await shouldDispatch(thread, message))) return
    await send(
      toUserContent(burstMessages(message, context)),
      { thread, auth: discordUserAuth(message.author.userId, message.author.userName, message.author.fullName, thread.channelId) }
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
