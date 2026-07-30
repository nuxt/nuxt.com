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

function isSlackAuth(auth: AdminMcpAuthContext): boolean {
  // Vercel Connect only installs slack/nuxi on our workspace, so the issuer is
  // gate enough for the tenant. `buildSlackAuthContext` sets it to
  // `slack:<teamId>` (bare `slack` when Slack omits the team).
  const isSlackIssuer = auth.issuer === 'slack' || Boolean(auth.issuer?.startsWith('slack:'))
  if (!isSlackIssuer) return false
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
  if (isSlackAuth(auth)) return true
  if (isDiscordAuth(auth)) return true
  return authAttr(auth.attributes, 'role') === 'admin'
}
