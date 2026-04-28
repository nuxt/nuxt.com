import type { H3Event } from 'h3'

export async function getAgentFingerprint(event: H3Event): Promise<string> {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const userAgent = getHeader(event, 'user-agent') || 'unknown'
  const domain = getHeader(event, 'host') || 'localhost'
  const data = `${domain}+${ip}+${userAgent}`
  const buffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(data))
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('')
}
