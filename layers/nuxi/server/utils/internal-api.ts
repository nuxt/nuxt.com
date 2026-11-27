import { timingSafeEqual } from 'node:crypto'
import { createError, getRequestHeader, type RequestEvent } from 'nuxt/server'

function safeBearerMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function requireInternalRequest(event: RequestEvent) {
  const secret = process.env.INTERNAL_API_SECRET?.trim()

  if (!secret) {
    throw createError({
      status: 503,
      statusText: 'Internal API is not configured'
    })
  }

  const authorization = getRequestHeader(event, 'authorization') ?? ''
  if (!safeBearerMatch(authorization, `Bearer ${secret}`)) {
    throw createError({
      status: 401,
      statusText: 'Unauthorized'
    })
  }
}
