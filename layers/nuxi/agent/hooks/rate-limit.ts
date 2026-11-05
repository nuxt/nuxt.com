import { defineHook } from 'eve/hooks'
import { resolveContext } from '../lib/identity/context.js'
import { consumeDailyQuota } from '../lib/rate-limit.js'
import { ANONYMOUS_IP_DAILY_LIMIT } from '../../shared/utils/rate-limit.js'

export default defineHook({
  events: {
    async 'turn.started'(_event, ctx) {
      // Web chat quota. Discord public channels are metered before dispatch
      // (`channels/discord.ts`) so the user gets a reply; Slack and admin
      // surfaces are unmetered. Subagent turns never count: one message can fan
      // out into many of them under the same principal.
      if (ctx.session.parent) return
      const auth = ctx.session.auth.current
      if (resolveContext(auth).surface !== 'web' || !auth?.principalId) return

      // Throwing from a hook doesn't stop the turn; `ctx.cancel()` does, before the
      // model runs. The web client refetches its usage after each turn and shows the limit.
      if (await consumeDailyQuota(auth.principalId) === 'limited') {
        ctx.cancel()
        return
      }

      // A fresh cookie is a fresh anonymous id, so anonymous visitors also share a per-IP budget.
      const ipKey = auth.principalType === 'anonymous' ? auth.attributes?.ip_key : undefined
      if (typeof ipKey === 'string' && await consumeDailyQuota(ipKey, ANONYMOUS_IP_DAILY_LIMIT) === 'limited') {
        ctx.cancel()
      }
    }
  }
})
