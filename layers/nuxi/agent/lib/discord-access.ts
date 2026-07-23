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
  return allowedDiscordChannelIds().has(channelId)
}

/**
 * Session auth for a Discord user. The `discord` issuer is what
 * `canAccessAdminMcp` matches to grant admin access to Discord sessions.
 */
export function discordUserAuth(userId: string | undefined, userName?: string) {
  const attributes: Record<string, string> = {}
  if (userName) attributes.username = userName
  return {
    attributes,
    authenticator: 'discord',
    issuer: 'discord',
    principalId: `discord:${userId ?? 'unknown'}`,
    principalType: 'user' as const
  }
}
