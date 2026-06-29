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
  if (auth.issuer?.startsWith('slack:') || auth.issuer === 'slack') return true
  return Boolean(authAttr(auth.attributes, 'team_id'))
}

export function isScheduleAppAuth(auth: AdminMcpAuthContext): boolean {
  return auth.principalId === 'eve:app' && auth.principalType === 'runtime'
}

/** Whether the current session may use the admin-mcp tools. */
export function canAccessAdminMcp(auth: AdminMcpAuthContext | null | undefined): boolean {
  if (!auth) return false
  if (isScheduleAppAuth(auth)) return true
  // Slack access is gated by Vercel Connect — the bot is only installable on our workspace.
  if (isSlackAuth(auth)) return true
  return authAttr(auth.attributes, 'role') === 'admin'
}
