import { isAllowedDiscordChannel } from './discord-access.js'
import { resolveContext, type AdminMcpAuthContext, type Context, type Surface } from './context.js'

export type { AdminMcpAuthContext } from './context.js'

/**
 * "Who is allowed to use admin-mcp tools" — one predicate per surface. Add a
 * surface by adding a line here, never a new branch in `canAccessAdminMcp`.
 */
const ADMIN_RULES: Record<Surface, (ctx: Context) => boolean> = {
  // The Eve scheduler running workflows (weekly digest, firehose summary) — no
  // human in the loop, always trusted.
  schedule: () => true,
  // Any human Slack user in the connected workspace. `context.ts` flags bots
  // as `isBot: true` — a bot posting in a channel Nuxi watches is not a team
  // member asking a question, so it never inherits admin.
  slack: ctx => ctx.person !== null && !ctx.person.isBot,
  // A Discord user, but only from a channel in DISCORD_ALLOWED_CHANNELS.
  // `channel` is only populated from the verified live thread (see
  // discord-access.ts), so a session resumed from an unlisted channel (e.g. a
  // HITL button click) can't forge a different one and bypass the allowlist.
  discord: ctx => Boolean(ctx.channel && isAllowedDiscordChannel(ctx.channel.id)),
  // Web session whose GitHub-derived role (Nuxt core team + admin logins
  // list) is 'admin'. `role` is a site permission, not a "who/where" fact, so
  // it has no dedicated `Context` field — read straight off the raw auth.
  web: ctx => ctx.raw.attributes?.role === 'admin',
  unknown: () => false
}

/** Whether the current session may use the admin-mcp tools. */
export function canAccessAdminMcp(auth: AdminMcpAuthContext | null | undefined): boolean {
  const ctx = resolveContext(auth)
  return ADMIN_RULES[ctx.surface](ctx)
}
