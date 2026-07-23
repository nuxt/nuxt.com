/**
 * Discord access is allowlist-based for now: Nuxi only dispatches for slash
 * commands invoked in the channels listed in `DISCORD_ALLOWED_CHANNELS`
 * (comma-separated Discord channel ids). Unset or empty means deny everywhere.
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
