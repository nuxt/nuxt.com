import { getAll } from '@vercel/global-config'
import { loadWorkflowConfig } from './workflow-config.js'

/** Discord dispatch is allowlist-based: only @mentions/threads in `discordAllowedChannels` (Global Config) run. Unset/empty denies everywhere; allowlisted sessions get admin mode. */

/** True when the Discord bot credentials needed by `@chat-adapter/discord` are set. */
export function isDiscordConfigured(): boolean {
  return Boolean(
    process.env.DISCORD_BOT_TOKEN?.trim()
    && process.env.DISCORD_PUBLIC_KEY?.trim()
    && process.env.DISCORD_APPLICATION_ID?.trim()
  )
}

/** Optional digest-mirror channel (`workflow.discord.channel` in Global Config) — distinct from `discordAllowedChannels` (live @mentions only). Unset disables mirroring. */
export async function discordWorkflowChannelId(): Promise<string | undefined> {
  const config = await loadWorkflowConfig()
  return config.discord?.channel?.trim() || undefined
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
 * Always pass the originating thread's `channelId` (including HITL resumes) — `admin-mode.ts` checks it
 * against `discordAllowedChannels`, so a stale/forged value can't bypass the allowlist.
 * `userName` (the @-mention handle, e.g. `hugorcd_`) is kept separately from `fullName` (Discord display
 * name) so `context.ts` can show the model a real name while the handle stays available for later use.
 */
export function discordUserAuth(
  userId: string | undefined,
  userName: string | undefined,
  fullName: string | undefined,
  channelId: string | undefined
) {
  const attributes: Record<string, string> = {}
  if (userName) attributes.username = userName
  if (fullName) attributes.full_name = fullName
  if (channelId) attributes.channel_id = channelId
  return {
    attributes,
    authenticator: 'discord',
    issuer: 'discord',
    principalId: `discord:${userId ?? 'unknown'}`,
    principalType: 'user' as const
  }
}
