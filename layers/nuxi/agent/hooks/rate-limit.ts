import { defineHook } from 'eve/hooks'
import { appOrigin, chatIdFromContinuationToken, internalHeaders } from '../lib/internal-api.js'

type TurnStartedContext = {
  session: {
    auth: {
      current?: {
        principalId?: string
      } | null
    }
  }
  channel: {
    continuationToken?: string
  }
  eve?: {
    request?: Request
  }
}

export default defineHook({
  events: {
    async 'turn.started'(_event, ctx) {
      const hookCtx = ctx as TurnStartedContext

      // This quota exists to throttle anonymous abuse of the public web chat
      // widget (see `ensureRateLimitPrincipalId`: "browser-facing routes
      // only"). Slack/Discord are trusted, allowlisted team channels, and a
      // single request there can fan out into many subagent turns that each
      // fire `turn.started` under the same principal — so metering them here
      // burns through the daily quota almost instantly for legitimate use.
      // Only meter sessions that map to a real web chat id, same check
      // `chat-title.ts` uses to scope itself to the web chat widget.
      if (!chatIdFromContinuationToken(hookCtx.channel.continuationToken)) return

      const principalId = hookCtx.session.auth.current?.principalId
      if (!principalId) return

      const cookie = hookCtx.eve?.request?.headers.get('cookie') ?? ''
      const response = await fetch(`${appOrigin()}/api/internal/agent/rate-limit/consume`, {
        method: 'POST',
        headers: internalHeaders(cookie ? { cookie } : undefined),
        body: JSON.stringify({ userId: principalId })
      })

      if (response.status === 429) {
        const data = await response.json().catch(() => ({})) as { message?: string }
        throw new Error(data.message ?? 'Daily message limit reached.')
      }

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Rate limit check failed: ${text}`)
      }
    }
  }
})
