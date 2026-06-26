import type { H3Event } from 'h3'

/** Resolves a durable principal id for auth checks, rate limits, and chat ownership. */
export async function resolveSessionPrincipalId(event: H3Event): Promise<string> {
  const session = await getUserSession(event)
  if (session.user?.id) return session.user.id

  if (session.anonymousUserId) return session.anonymousUserId

  const anonymousUserId = crypto.randomUUID()
  await setUserSession(event, { anonymousUserId })
  return anonymousUserId
}
