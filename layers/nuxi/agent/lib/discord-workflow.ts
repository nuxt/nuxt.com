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

/** Reads the final assistant text off a completed session's event stream. */
async function finalMessageText(session: Session): Promise<string | null> {
  const stream = await session.getEventStream()
  let text: string | null = null
  for await (const event of stream) {
    if (event.type === 'message.completed' && event.data.message) {
      text = event.data.message
    }
    if (event.type === 'session.completed' || event.type === 'session.failed') break
  }
  return text
}

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
    const text = await finalMessageText(session)
    if (!text) return

    await bot.initialize()
    const discord = bot.getAdapter('discord')
    if (!discord) return

    const threadId = await resolveDiscordThreadId(discord, channelId)
    await discord.postMessage(threadId, slackTextToDiscord(text))
  } catch (error) {
    console.warn('[nuxi:discord-workflow] failed to mirror digest to Discord', error)
  }
}
