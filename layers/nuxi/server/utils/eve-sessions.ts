import type { H3Event } from 'h3'

/**
 * Ends the Eve sessions behind deleted chats. A user's session is private, so Eve
 * requests deletion of its stored transcript when it ends instead of after 30 idle days.
 * Best effort: a session Eve can't end still expires on its own, so this never blocks a deletion.
 */
export async function endEveSessions(event: H3Event, sessionIds: (string | undefined)[]) {
  const secret = process.env.INTERNAL_API_SECRET?.trim()
  const ids = [...new Set(sessionIds.filter(Boolean))] as string[]
  if (!secret || !ids.length) return

  const origin = getRequestURL(event).origin
  const results = await Promise.allSettled(ids.map(async (id) => {
    const response = await fetch(`${origin}/eve/v1/session/${encodeURIComponent(id)}/end`, {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(10_000)
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
  }))

  const failed = results.flatMap((result, index) => result.status === 'rejected' ? [{ sessionId: ids[index], error: String(result.reason) }] : [])
  if (failed.length) console.warn('[nuxi:eve] could not end sessions of deleted chats', failed)
}
