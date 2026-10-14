/** Daily messages shared by all anonymous visitors on one IP (offices and NATs share an address). */
export const ANONYMOUS_IP_DAILY_LIMIT = 40

/** `x-real-ip` is set by Vercel; `x-forwarded-for` covers other proxies and local setups. */
export function clientIp(getHeader: (name: string) => string | null | undefined): string | undefined {
  const ip = getHeader('x-real-ip') ?? getHeader('x-forwarded-for')?.split(',')[0]
  return ip?.trim() || undefined
}

/** Rate-limit key for anonymous visitors on an IP, salted so stored keys can't be mapped back to IPs. */
export async function anonymousIpKey(ip: string): Promise<string | undefined> {
  const secret = process.env.INTERNAL_API_SECRET?.trim()
  if (!secret) return undefined

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${secret}:${ip}`))
  const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
  return `anon-ip:${hex.slice(0, 32)}`
}
