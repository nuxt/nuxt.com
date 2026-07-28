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
  // Vercel Connect only installs slack/nuxi on our workspace — no extra team_id gate needed.
  if (auth.issuer?.startsWith('slack:') || auth.issuer === 'slack') return true
  return Boolean(authAttr(auth.attributes, 'team_id'))
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
