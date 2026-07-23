import type { DiscordAdapter } from '@chat-adapter/discord'
import type { Session } from 'eve/channels'
import { bot } from '../channels/discord.js'
import { slackTextToDiscord } from './discord-format.js'

/**
 * Optional Discord channel where the weekly-digest and firehose-summary
 * scheduled workflows mirror their Slack digest. Separate from
 * `DISCORD_ALLOWED_CHANNELS` (which only gates live @mentions this bot
 * responds to) — this is a proactive post, not a mention-triggered session.
 * Unset disables mirroring for both workflows.
 */
export function discordWorkflowChannelId(): string | undefined {
  return process.env.DISCORD_WORKFLOW_CHANNEL_ID?.trim() || undefined
}

const threadIdCache = new Map<string, string>()

/**
 * Resolves the Chat SDK thread id (`discord:<guildId>:<channelId>`) for a raw
 * Discord channel id, caching the result for the life of the process.
 * `postMessage` only uses the `channelId` segment, but we still resolve the
 * real `guildId` (via the adapter's public `fetchThread`, reading
 * `metadata.raw.guild_id` from Discord's API response) instead of a
 * placeholder, since other adapter methods may depend on it.
 */
async function resolveDiscordThreadId(discord: DiscordAdapter, channelId: string): Promise<string> {
  const cached = threadIdCache.get(channelId)
  if (cached) return cached

  const info = await discord.fetchThread(`discord:_:${channelId}`)
  const raw = info.metadata.raw
  const guildId = raw && typeof raw === 'object' && typeof (raw as { guild_id?: unknown }).guild_id === 'string'
    ? (raw as { guild_id: string }).guild_id
    : '_'

  const threadId = `discord:${guildId}:${channelId}`
  threadIdCache.set(channelId, threadId)
  return threadId
}

/**
 * Reads the exact text Slack's default `message.completed` handler posts to
 * the channel — a `finishReason: "tool-calls"` event is pre-tool narration
 * (buffered by Slack as a typing-indicator label, never posted verbatim), so
 * it's skipped here too; only a non-tool-calls `message.completed` carries
 * the real reply.
 *
 * Returns as soon as that event arrives instead of waiting for
 * `session.completed`/`session.failed` to end the loop naturally — Slack
 * thread sessions stay open for follow-up replies and may never emit one,
 * which would otherwise hang this forever.
 */
async function finalMessageText(session: Session): Promise<string | null> {
  const stream = await session.getEventStream()
  for await (const event of stream) {
    if (event.type === 'message.completed') {
      if (event.data.finishReason === 'tool-calls') continue
      if (event.data.message) return event.data.message
    }
    if (event.type === 'session.completed' || event.type === 'session.failed') break
  }
  return null
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}

/**
 * `receive()` resolves once the Slack session/run is *started*, not once the
 * digest is fully generated — the actual turn (several MCP tool calls:
 * feedback-stats, agent-usage-stats, etc.) keeps running as a separate
 * durable workflow continuation after `receiveOnSlack()`'s `await receive()`
 * returns. The first preview test used a 20s timeout here and always hit it
 * (confirmed via logs: the mirror ran, but `finalMessageText` never saw a
 * `message.completed` event in time) — 20s is far shorter than a real digest
 * generation. Budget generously against the schedule/ops function's own
 * execution ceiling (300s) instead.
 */
const EVENT_STREAM_TIMEOUT_MS = 180_000

/**
 * Mirrors a completed Slack digest session to Discord: reuses the model's
 * already-generated text (no second agent run — see `discord-format.ts` for
 * why a straight copy would break), converts its Slack syntax to Discord
 * Markdown, and posts it directly through the Discord adapter.
 *
 * Never throws — a mirroring failure is logged and must not affect the Slack
 * delivery it piggybacks on. Call under `waitUntil` from a schedule.
 */
export async function mirrorDigestToDiscord({
  session,
  channelId
}: {
  session: Session
  channelId: string
}): Promise<void> {
  try {
    console.log('[nuxi:discord-workflow] mirroring digest, reading Slack session event stream', { channelId })
    const text = await withTimeout(finalMessageText(session), EVENT_STREAM_TIMEOUT_MS, 'reading Slack session event stream')
    if (!text) {
      console.warn('[nuxi:discord-workflow] no message text found on session event stream, skipping mirror', { channelId })
      return
    }

    await bot.initialize()
    const discord = bot.getAdapter('discord')
    if (!discord) {
      console.warn('[nuxi:discord-workflow] discord adapter not available, skipping mirror', { channelId })
      return
    }

    const threadId = await resolveDiscordThreadId(discord, channelId)
    await discord.postMessage(threadId, slackTextToDiscord(text))
    console.log('[nuxi:discord-workflow] mirrored digest to Discord', { channelId, threadId })
  } catch (error) {
    console.warn('[nuxi:discord-workflow] failed to mirror digest to Discord', { channelId }, error)
  }
}
