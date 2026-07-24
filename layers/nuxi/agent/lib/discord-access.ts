/**
 * Discord access is allowlist-based for now: Nuxi only dispatches for
 * @mentions (and subscribed thread follow-ups) in the channels listed in
 * `DISCORD_ALLOWED_CHANNELS` (comma-separated Discord channel ids). Unset or
 * empty means deny everywhere.
 *
 * Because dispatch is restricted to these trusted channels, Discord sessions
 * are granted admin access by default (see `admin-mcp-access.ts`).
 */
export function allowedDiscordChannelIds(): Set<string> {
  const raw = process.env.DISCORD_ALLOWED_CHANNELS ?? ''
  return new Set(
    raw.split(',').map(id => id.trim()).filter(Boolean)
  )
}

export function isAllowedDiscordChannel(channelId: string | undefined): boolean {
  if (!channelId) return false
  const ids = allowedDiscordChannelIds()
  if (ids.has(channelId)) return true
  // Chat SDK channel ids are prefixed (`discord:<guildId>:<channelId>`) while
  // the allowlist holds raw Discord channel ids — match the trailing segment.
  const raw = channelId.split(':').pop()
  return Boolean(raw && ids.has(raw))
}

/**
 * Session auth for a Discord user. The `discord` issuer plus the
 * `allowedChannel` claim below are what `canAccessAdminMcp` matches to grant
 * admin access to Discord sessions — always pass the originating thread's
 * `channelId` (including on HITL resumes) so that check can't be bypassed.
 */
export function discordUserAuth(userId: string | undefined, userName: string | undefined, channelId: string | undefined) {
  const attributes: Record<string, string> = {}
  if (userName) attributes.username = userName
  // Only set once the channel is verified against DISCORD_ALLOWED_CHANNELS —
  // `isDiscordAuth` in admin-mcp-access.ts requires this claim before
  // granting admin, so a session resumed from an unlisted channel (e.g. a
  // HITL button click) never gets it.
  if (isAllowedDiscordChannel(channelId)) attributes.allowedChannel = 'true'
  return {
    attributes,
    authenticator: 'discord',
    issuer: 'discord',
    principalId: `discord:${userId ?? 'unknown'}`,
    principalType: 'user' as const
  }
}
