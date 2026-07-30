import type { AuthFn } from 'eve/channels/auth'
import { localDev, vercelOidc } from 'eve/channels/auth'
import { defaultEveAuth, eveChannel } from 'eve/channels/eve'
import { appOrigin, internalHeaders } from '../lib/internal-api.js'

interface SessionPrincipal {
  principalId: string
  principalType: 'user' | 'anonymous'
  authenticated: boolean
  attributes?: {
    login?: string
    name?: string
    avatar?: string
    role?: string
  }
}

function nuxtSessionAuth(): AuthFn<Request> {
  return async (request) => {
    const cookie = request.headers.get('cookie') ?? ''
    if (!cookie) return null

    try {
      const response = await fetch(`${appOrigin()}/api/internal/session`, {
        headers: internalHeaders({ cookie })
      })

      if (!response.ok) return null

      const data = await response.json() as SessionPrincipal

      return {
        attributes: data.attributes ?? {},
        authenticator: data.authenticated ? 'github' : 'anonymous',
        issuer: 'nuxt.com',
        principalId: data.principalId,
        principalType: data.principalType === 'user' ? 'user' : 'anonymous'
      }
    } catch {
      return null
    }
  }
}

export default eveChannel({
  auth: [
    nuxtSessionAuth(),
    localDev(),
    vercelOidc()
  ],
  // Anything scoped to a single turn (the page the user has open) rides on
  // `clientContext` from the client instead — what lands here is prepended to
  // durable history, so it has to be worth keeping for the whole session.
  async onMessage(ctx, message) {
    const context: string[] = []
    const chatId = ctx.eve.request.headers.get('x-nuxi-chat-id')?.trim()
    const isNewSession = !ctx.eve.sessionId

    if (isNewSession && chatId) {
      try {
        const cookie = ctx.eve.request.headers.get('cookie') ?? ''
        const response = await fetch(`${appOrigin()}/api/internal/chats/${encodeURIComponent(chatId)}/context`, {
          headers: internalHeaders(cookie ? { cookie } : undefined)
        })

        if (response.ok) {
          const data = await response.json() as { summary?: string }
          if (data.summary) {
            context.push(`Prior conversation (for context):\n${data.summary}`)
          }
        }
      } catch {
        // Non-fatal — continue without prior context
      }
    }

    if (typeof message === 'string' && message.trim()) {
      context.push(`User message: ${message}`)
    }

    return {
      auth: defaultEveAuth(ctx),
      context: context.length ? context : undefined
    }
  }
})
