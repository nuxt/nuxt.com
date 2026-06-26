import { timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

function safeBearerMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function requireInternalRequest(event: H3Event) {
  const secret = process.env.INTERNAL_API_SECRET?.trim()

  if (!secret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Internal API is not configured'
    })
  }

  const authorization = getRequestHeader(event, 'authorization') ?? ''
  if (!safeBearerMatch(authorization, `Bearer ${secret}`)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
}

export async function resolveInternalPrincipalId(event: H3Event): Promise<string | undefined> {
  const session = await getUserSession(event)
  return session.user?.id || session.id || undefined
}
