/**
 * Discord access is allowlist-based: Nuxi only dispatches for @mentions (and
 * subscribed thread follow-ups) in `DISCORD_ALLOWED_CHANNELS` (comma-separated
 * channel ids). Unset/empty means deny everywhere. Allowlisted sessions get
 * admin MCP access (see `admin-mcp-access.ts`).
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
 * Distinct from `DISCORD_ALLOWED_CHANNELS` (live @mentions only). Unset disables mirroring.
 */
export function discordWorkflowChannelId(): string | undefined {
  return process.env.DISCORD_WORKFLOW_CHANNEL_ID?.trim() || undefined
}

let cachedAllowlist: Set<string> | null = null

export function allowedDiscordChannelIds(): Set<string> {
  if (cachedAllowlist) return cachedAllowlist
  const raw = process.env.DISCORD_ALLOWED_CHANNELS ?? ''
  cachedAllowlist = new Set(
    raw.split(',').map(id => id.trim()).filter(Boolean)
  )
  return cachedAllowlist
}

export function isAllowedDiscordChannel(channelId: string | undefined): boolean {
  if (!channelId) return false
  const ids = allowedDiscordChannelIds()
  if (ids.has(channelId)) return true
  // Chat SDK ids are `discord:<guildId>:<channelId>`; allowlist holds raw ids.
  const raw = channelId.split(':').pop()
  return Boolean(raw && ids.has(raw))
}

/**
 * Session auth for a Discord user. The `discord` issuer plus `channel_id`
 * below are what `context.ts` reads to build the Discord `Context` that
 * `admin-mcp-access.ts` checks against `DISCORD_ALLOWED_CHANNELS` — always
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
