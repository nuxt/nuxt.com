import { isAllowedDiscordChannel } from './discord-access.js'
import { resolveContext, type AuthContext, type Context, type Surface } from './context.js'

export type { AuthContext } from './context.js'

/**
 * Whether a session is in admin mode — one predicate per surface. Nuxi has
 * exactly two modes: public (only the base toolset) or admin (every tool and
 * capability). Add a surface by adding a line here, never a new branch in
 * `isAdminMode`.
 */
const ADMIN_MODE_RULES: Record<Surface, (ctx: Context) => boolean | Promise<boolean>> = {
  // The Eve scheduler running workflows (weekly digest, firehose summary) — no
  // human in the loop, always trusted.
  schedule: () => true,
  // Any human Slack user in the connected workspace. `context.ts` flags bots
  // as `isBot: true` — a bot posting in a channel Nuxi watches is not a team
  // member asking a question, so it never inherits admin mode.
  slack: ctx => ctx.person !== null && !ctx.person.isBot,
  // A Discord user, but only from a channel in the `discordAllowedChannels`
  // Global Config key. `channel` is only populated from the verified live
  // thread (see discord-access.ts), so a session resumed from an unlisted
  // channel (e.g. a HITL button click) can't forge a different one and
  // bypass the allowlist.
  discord: async ctx => Boolean(ctx.channel && await isAllowedDiscordChannel(ctx.channel.id)),
  // Web session whose GitHub-derived role (Nuxt core team + admin logins
  // list) is 'admin'. `role` is a site permission, not a "who/where" fact, so
  // it has no dedicated `Context` field — read straight off the raw auth.
  web: ctx => ctx.raw.attributes?.role === 'admin',
  unknown: () => false
}

/** Whether the current session is in admin mode (every tool and capability, vs. the public toolset). */
export async function isAdminMode(auth: AuthContext | null | undefined): Promise<boolean> {
  const ctx = resolveContext(auth)
  return ADMIN_MODE_RULES[ctx.surface](ctx)
}
