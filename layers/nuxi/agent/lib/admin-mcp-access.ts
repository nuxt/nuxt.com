type AuthAttributes = Readonly<Record<string, string | readonly string[]>>

export interface AdminMcpAuthContext {
  issuer?: string
  principalId?: string
  principalType?: string
  attributes?: AuthAttributes
}

function authAttr(attributes: AuthAttributes | undefined, key: string): string | undefined {
  const value = attributes?.[key]
  return typeof value === 'string' ? value : undefined
}

/** `buildSlackAuthContext` sets `slack:<teamId>`, or bare `slack` with no team. */
function isSlackIssuer(auth: AdminMcpAuthContext): boolean {
  return auth.issuer === 'slack' || Boolean(auth.issuer?.startsWith('slack:'))
}

function isSlackAuth(auth: AdminMcpAuthContext): boolean {
  // Vercel Connect only installs slack/nuxi on our workspace, so the issuer is
  // gate enough for the tenant.
  if (!isSlackIssuer(auth)) return false
  // Same builder stamps `author_type` and downgrades bots to `service`. A bot
  // posting in a channel Nuxi watches is not a team member asking a question,
  // so it never inherits admin.
  return auth.principalType === 'user' && authAttr(auth.attributes, 'author_type') !== 'bot'
}

function isDiscordAuth(auth: AdminMcpAuthContext): boolean {
  const isDiscordIssuer = auth.issuer === 'discord' || Boolean(auth.issuer?.startsWith('discord:'))
  if (!isDiscordIssuer) return false
  // Discord dispatch is gated to an allowlist of trusted channels
  // (DISCORD_ALLOWED_CHANNELS, see channels/discord.ts). `discordUserAuth`
  // only sets this claim once it has verified the originating channel, so a
  // session resumed from an unlisted channel (e.g. a HITL button click)
  // can't bypass the allowlist and still get admin access.
  return authAttr(auth.attributes, 'allowedChannel') === 'true'
}

export function isScheduleAppAuth(auth: AdminMcpAuthContext): boolean {
  return auth.principalId === 'eve:app' && auth.principalType === 'runtime'
}

/** Whether the current session may use the admin-mcp tools. */
export function canAccessAdminMcp(auth: AdminMcpAuthContext | null | undefined): boolean {
  if (!auth) return false
  if (isScheduleAppAuth(auth)) return true
  // `isSlackAuth` is the whole decision for a Slack principal. Falling through
  // would let a rejected one (a bot) reach the generic grant below on any
  // future `role` attribute, which is exactly what the bot check exists to stop.
  if (isSlackIssuer(auth)) return isSlackAuth(auth)
  if (isDiscordAuth(auth)) return true
  // Web sessions only: `role` comes from `/api/internal/session`.
  return authAttr(auth.attributes, 'role') === 'admin'
}
