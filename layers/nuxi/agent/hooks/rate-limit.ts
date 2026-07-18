import { defineHook } from 'eve/hooks'
import { appOrigin, internalHeaders } from '../lib/internal-api.js'

type TurnStartedContext = {
  session: {
    auth: {
      current?: {
        principalId?: string
      } | null
    }
  }
  eve?: {
    request?: Request
  }
}

export default defineHook({
  events: {
    async 'turn.started'(_event, ctx) {
      const hookCtx = ctx as TurnStartedContext
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
