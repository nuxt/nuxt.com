import type { H3Event } from 'h3'

export async function generateFeedbackHash(
  today: string,
  ip: string,
  domain: string,
  userAgent: string
): Promise<string> {
  const data = `${today}+${domain}+${ip}+${userAgent}`

  const buffer = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(data)
  )

  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Daily fingerprint from request IP / UA / host (UTC date). Shared by docs + MCP feedback. */
export async function getFeedbackFingerprint(event: H3Event): Promise<string> {
  const ip = event.context.cf?.ip || 'unknown'
  const userAgent = getHeader(event, 'user-agent') || 'unknown'
  const domain = getHeader(event, 'host') || 'localhost'
  const today = new Date().toISOString().split('T')[0]!

  return generateFeedbackHash(today, ip, domain, userAgent)
}
