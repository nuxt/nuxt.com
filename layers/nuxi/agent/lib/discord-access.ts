import { getAll } from '@vercel/global-config'

/**
 * Discord access is allowlist-based: Nuxi only dispatches for @mentions (and
 * subscribed thread follow-ups) in the `discordAllowedChannels` Global Config
 * key (JSON array of channel ids) — edit it from the Vercel dashboard, no
 * redeploy needed. Unset/empty means deny everywhere. Allowlisted sessions
 * get admin mode (see `admin-mode.ts`).
 */

/** True when the Discord bot credentials needed by `@chat-adapter/discord` are set. */
export function isDiscordConfigured(): boolean {
  return Boolean(
    process.env.DISCORD_BOT_TOKEN?.trim()
    && process.env.DISCORD_PUBLIC_KEY?.trim()
    && process.env.DISCORD_APPLICATION_ID?.trim()
  )
}

/**
 * Optional Discord channel for scheduled digest mirrors (weekly + firehose).
 * Distinct from `discordAllowedChannels` (live @mentions only). Unset disables mirroring.
 */
export function discordWorkflowChannelId(): string | undefined {
  return process.env.DISCORD_WORKFLOW_CHANNEL_ID?.trim() || undefined
}

export async function allowedDiscordChannelIds(): Promise<Set<string>> {
  const config = await getAll<{ discordAllowedChannels?: string[] }>(['discordAllowedChannels'])
  const raw = config.discordAllowedChannels
  return new Set(Array.isArray(raw) ? raw.map(id => String(id).trim()).filter(Boolean) : [])
}

export async function isAllowedDiscordChannel(channelId: string | undefined): Promise<boolean> {
  if (!channelId) return false
  const ids = await allowedDiscordChannelIds()
  if (ids.has(channelId)) return true
  // Chat SDK ids are `discord:<guildId>:<channelId>`; allowlist holds raw ids.
  const raw = channelId.split(':').pop()
  return Boolean(raw && ids.has(raw))
}

/**
 * Session auth for a Discord user. The `discord` issuer plus `channel_id`
 * below are what `context.ts` reads to build the Discord `Context` that
 * `admin-mode.ts` checks against `discordAllowedChannels` — always
 * pass the originating thread's `channelId` (including on HITL resumes) so
 * that check can't be bypassed with a stale or forged channel.
 */
export function discordUserAuth(userId: string | undefined, userName: string | undefined, channelId: string | undefined) {
  const attributes: Record<string, string> = {}
  if (userName) attributes.username = userName
  if (channelId) attributes.channel_id = channelId
  return {
    attributes,
    authenticator: 'discord',
    issuer: 'discord',
    principalId: `discord:${userId ?? 'unknown'}`,
    principalType: 'user' as const
  }
}
