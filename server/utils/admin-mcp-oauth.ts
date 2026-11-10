import OAuth2Server from '@node-oauth/oauth2-server'
import { createError, getCookie, getHeader, getRequestWebStream, setHeader, setResponseStatus } from 'h3'
import type { H3Event } from 'h3'
import { z } from 'zod'
import { createAdminMcpOAuth, mcpOAuthUrls, oauthHash } from '../lib/admin-mcp-oauth'
import type { AdminMcpAuthorization } from '../lib/admin-mcp-oauth'

export function adminMcpOAuth(event: H3Event) {
  return createAdminMcpOAuth(db, useRuntimeConfig(event).mcpOauthIssuer, async (user) => {
    const githubUser = await $fetch<{ login: string }>(`https://api.github.com/user/${encodeURIComponent(user.providerId)}`, {
      headers: githubHeaders(event)
    })
    return isCoreTeamMember(event, githubUser.login.toLowerCase())
  })
}

export const adminMcpOAuthUrls = (event: H3Event) => mcpOAuthUrls(useRuntimeConfig(event).mcpOauthIssuer)

export interface PendingMcpConsent {
  request: AdminMcpAuthorization
  browserHash: string
  expiresAt: number
}

export async function pendingMcpConsent(event: H3Event, id: string) {
  const pending = await kv.get<PendingMcpConsent>(`mcp:consent:${id}`)
  const browser = getCookie(event, 'mcp-oauth-browser')
  if (!pending || pending.expiresAt <= Date.now() || !browser || oauthHash(browser) !== pending.browserHash) {
    throw createError({ statusCode: 400, statusMessage: 'This connection request has expired. Connect again from your MCP client.' })
  }
  return pending
}

export function requireMcpConsentOrigin(event: H3Event) {
  if (getHeader(event, 'origin') !== adminMcpOAuthUrls(event).issuer) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid consent origin' })
  }
}

export async function mcpOAuthResponse<T>(event: H3Event, operation: () => Promise<T>) {
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'Pragma', 'no-cache')
  try {
    return await operation()
  } catch (error) {
    if (error instanceof OAuth2Server.OAuthError) {
      if (error.code >= 500) throw error
      setResponseStatus(event, error.code)
      return { error: error.name, error_description: error.message }
    }
    if (error instanceof z.ZodError) {
      setResponseStatus(event, 400)
      return { error: 'invalid_request', error_description: 'Invalid OAuth request parameters' }
    }
    throw error
  }
}

export async function readMcpOAuthBody(event: H3Event, form = false): Promise<unknown> {
  const contentType = getHeader(event, 'content-type')?.split(';')[0]?.trim()
  if (contentType !== (form ? 'application/x-www-form-urlencoded' : 'application/json')) {
    throw new OAuth2Server.InvalidRequestError('Unsupported Content-Type')
  }
  const stream = getRequestWebStream(event)
  if (!stream) throw new OAuth2Server.InvalidRequestError('Missing request body')
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let size = 0
  let body = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 8192) {
        await reader.cancel()
        throw new OAuth2Server.InvalidRequestError('OAuth request exceeds 8 KB')
      }
      body += decoder.decode(value, { stream: true })
    }
    body += decoder.decode()
  } finally {
    reader.releaseLock()
  }
  if (form) {
    const params = new URLSearchParams(body)
    if ([...params.keys()].some(key => params.getAll(key).length > 1)) throw new OAuth2Server.InvalidRequestError('Duplicate parameters')
    return Object.fromEntries(params)
  }
  try {
    return JSON.parse(body)
  } catch {
    throw new OAuth2Server.InvalidRequestError('Invalid JSON')
  }
}
