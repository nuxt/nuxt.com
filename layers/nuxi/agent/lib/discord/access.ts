import { z } from 'zod'
import { readGlobalConfig } from '../global-config.js'

/**
 * All Discord config lives under one `discord` Global Config key, editable
 * from the dashboard with no redeploy:
 *
 * ```json
 * "discord": {
 *   "channels": { "admin": ["1234567890123456"], "public": ["6543210987654321"] },
 *   "digestChannel": "1234567890123456"
 * }
 * ```
 *
 * `channels.admin` dispatches with full admin mode (`admin-mode.ts`), `channels.public`
 * dispatches with the public toolset only. A channel absent from both is silently
 * ignored, and unset/empty denies everywhere. `digestChannel` is the optional
 * weekly-digest/firehose mirror target (`digest-mirror.ts`) — distinct from
 * `channels`, which only gates live @mentions.
 */
const discordConfigSchema = z.object({
  channels: z.object({
    admin: z.array(z.string()).optional(),
    public: z.array(z.string()).optional()
  }).optional(),
  digestChannel: z.string().optional()
})

export type DiscordConfig = z.infer<typeof discordConfigSchema>

interface DiscordChannelTiers {
  admin: string[]
  public: string[]
}

function normalizeChannelIds(raw: string[] | undefined): string[] {
  return Array.isArray(raw) ? raw.map(id => String(id).trim()).filter(Boolean) : []
}

async function loadDiscordConfig(): Promise<DiscordConfig> {
  const config = await readGlobalConfig<{ discord?: unknown }>(['discord'])
  if (config.discord === undefined) return {}

  const parsed = discordConfigSchema.safeParse(config.discord)
  if (!parsed.success) {
    console.warn('[nuxi:discord] invalid `discord` in Global Config, denying all channels', parsed.error.flatten())
    return {}
  }
  return parsed.data
}

async function loadDiscordChannelTiers(): Promise<DiscordChannelTiers> {
  const config = await loadDiscordConfig()
  return {
    admin: normalizeChannelIds(config.channels?.admin),
    public: normalizeChannelIds(config.channels?.public)
  }
}

/** Chat SDK ids are `discord:<guildId>:<channelId>`; the config holds raw ids — match either form. */
function channelMatches(channelId: string | undefined, ids: readonly string[]): boolean {
  if (!channelId || ids.length === 0) return false
  if (ids.includes(channelId)) return true
  const raw = channelId.split(':').pop()
  return Boolean(raw && ids.includes(raw))
}

/** True when the Discord bot credentials needed by `@chat-adapter/discord` are set. */
export function isDiscordConfigured(): boolean {
  return Boolean(
    process.env.DISCORD_BOT_TOKEN?.trim()
    && process.env.DISCORD_PUBLIC_KEY?.trim()
    && process.env.DISCORD_APPLICATION_ID?.trim()
  )
}

/** Optional digest-mirror channel (`discord.digestChannel` in Global Config). Unset disables mirroring. */
export async function discordDigestChannelId(): Promise<string | undefined> {
  const config = await loadDiscordConfig()
  return config.digestChannel?.trim() || undefined
}

/** Whether a channel may dispatch at all — the union of `discord.channels.admin` and `.public`. */
export async function isAllowedDiscordChannel(channelId: string | undefined): Promise<boolean> {
  const tiers = await loadDiscordChannelTiers()
  return channelMatches(channelId, tiers.admin) || channelMatches(channelId, tiers.public)
}

/** Whether a channel grants admin mode — only `discord.channels.admin`, checked by `admin-mode.ts`. */
export async function isAdminDiscordChannel(channelId: string | undefined): Promise<boolean> {
  const tiers = await loadDiscordChannelTiers()
  return channelMatches(channelId, tiers.admin)
}

/**
 * Always pass the originating thread's `channelId` (including HITL resumes) — `admin-mode.ts` checks it
 * against `discord.channels.admin`, so a stale/forged value can't bypass the tiering.
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
