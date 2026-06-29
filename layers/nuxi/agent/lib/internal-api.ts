export function appOrigin() {
  const configured = process.env.NUXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '')
    || process.env.NUXT_SITE_URL?.trim().replace(/\/$/, '')

  if (configured) {
    return configured
  }

  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) {
    return `https://${vercelUrl}`
  }

  return 'http://localhost:3000'
}

export function internalHeaders(extra?: Record<string, string>) {
  const secret = process.env.INTERNAL_API_SECRET?.trim()
  if (!secret) {
    throw new Error('INTERNAL_API_SECRET is not configured')
  }

  return {
    'Authorization': `Bearer ${secret}`,
    'content-type': 'application/json',
    ...extra
  }
}

const INTERNAL_FETCH_TIMEOUT_MS = 10_000

export async function internalFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${appOrigin()}${path}`, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(INTERNAL_FETCH_TIMEOUT_MS),
    headers: {
      ...internalHeaders(),
      ...(init?.headers as Record<string, string> | undefined)
    }
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Internal API ${path} failed (${response.status}): ${text}`)
  }

  return await response.json() as T
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Eve namespaces continuation tokens as `{channel}:{chatId}`. */
export function chatIdFromContinuationToken(token: string | undefined): string | undefined {
  if (!token?.trim()) return undefined
  const raw = token.includes(':') ? token.slice(token.indexOf(':') + 1) : token
  return UUID_PATTERN.test(raw) ? raw : undefined
}
