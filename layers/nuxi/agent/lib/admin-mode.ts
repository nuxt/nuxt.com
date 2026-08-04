import { isAllowedDiscordChannel } from './discord-access.js'
import { resolveContext, type AuthContext, type Context, type Surface } from './context.js'

export type { AuthContext } from './context.js'

/** One predicate per surface — add a new surface here, never a new branch in `isAdminMode`. */
const ADMIN_MODE_RULES: Record<Surface, (ctx: Context) => boolean | Promise<boolean>> = {
  schedule: () => true, // Eve scheduler (no human in the loop) — always trusted
  slack: ctx => ctx.person !== null && !ctx.person.isBot, // human team member only
  // Only from a channel in `discordAllowedChannels`; `channel` comes from the verified
  // live thread, so a HITL resume can't forge one to bypass the allowlist.
  discord: async ctx => Boolean(ctx.channel && await isAllowedDiscordChannel(ctx.channel.id)),
  web: ctx => ctx.raw.attributes?.role === 'admin', // GitHub-derived site role
  unknown: () => false
}

/** Whether the current session is in admin mode (every tool and capability, vs. the public toolset). */
export async function isAdminMode(auth: AuthContext | null | undefined): Promise<boolean> {
  const ctx = resolveContext(auth)
  return ADMIN_MODE_RULES[ctx.surface](ctx)
}
