import type { AuthFn } from 'eve/channels/auth'
import { localDev, vercelOidc } from 'eve/channels/auth'
import { defaultEveAuth, eveChannel } from 'eve/channels/eve'
import { appOrigin, internalHeaders } from '../lib/internal-api.js'

const PAGE_PATH_PATTERN = /^\/[\w./-]*$/

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

function parsePagePath(request: Request): string | null {
  const raw = request.headers.get('x-page-path')?.trim() ?? null
  if (!raw || !PAGE_PATH_PATTERN.test(raw) || raw.length > 256) return null
  return raw
}

export default eveChannel({
  auth: [
    nuxtSessionAuth(),
    localDev(),
    vercelOidc()
  ],
  async onMessage(ctx, message) {
    const context: string[] = []
    const pagePath = parsePagePath(ctx.eve.request)
    const chatId = ctx.eve.request.headers.get('x-nuxi-chat-id')?.trim()
    const isNewSession = !ctx.eve.sessionId

    if (pagePath) {
      context.push(`Current page: ${pagePath}`)
    }

    if (isNewSession && chatId) {
      try {
        const response = await fetch(`${appOrigin()}/api/internal/chats/${encodeURIComponent(chatId)}/context`, {
          headers: internalHeaders()
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
