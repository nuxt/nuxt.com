import { getHeader, getRequestIP, type H3Event } from 'h3'

export interface FingerprintInput {
  /** UTC day (`YYYY-MM-DD`), so fingerprints rotate daily. */
  day: string
  ip: string
  userAgent: string
}

/** What a feedback fingerprint is derived from, or `undefined` when the request carries no client IP. */
export function fingerprintInput(event: H3Event): FingerprintInput | undefined {
  const ip = getRequestIP(event, { xForwardedFor: true })
  if (!ip) return

  return {
    day: new Date().toISOString().slice(0, 10),
    ip,
    userAgent: getHeader(event, 'user-agent') || ''
  }
}

/** Keyed per-visitor, per-day fingerprint, so stored values cannot be mapped back to an IP. */
export async function feedbackFingerprint(secret: string, { day, ip, userAgent }: FingerprintInput): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${day}\n${ip}\n${userAgent}`))
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('')
}
