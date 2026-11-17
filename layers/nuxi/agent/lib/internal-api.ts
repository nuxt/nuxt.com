import { getVercelOidcToken, getVercelOidcTokenSync } from '@vercel/oidc'

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

/**
 * A deployment URL (`*.vercel.app`) sits behind Vercel Authentication. Vercel lets a project call its own
 * deployments in the same environment when the request carries the project's OIDC token (Trusted Sources).
 * Empty when the app is reached through a configured site URL or runs outside Vercel.
 */
export function selfAccessHeaders(): Record<string, string> {
  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (!vercelUrl || appOrigin() !== `https://${vercelUrl}`) return {}

  // Vercel attaches a fresh token to every function invocation: no refresh needed.
  const token = readOidcToken()
  if (!token) {
    console.warn('[nuxi] no Vercel OIDC token: calls to this deployment may be blocked by Vercel Authentication')
    return {}
  }
  return { 'x-vercel-trusted-oidc-idp-token': token }
}

/** The token is missing when the helper throws, and empty in the builds of `@vercel/oidc` that cannot read it. */
function readOidcToken(): string | undefined {
  try {
    return getVercelOidcTokenSync() || undefined
  } catch {
    return undefined
  }
}

/** `fetch` for a path of this app. */
export async function appFetch(path: string, init?: RequestInit): Promise<Response> {
  return await fetch(`${appOrigin()}${path}`, {
    ...init,
    headers: {
      ...selfAccessHeaders(),
      ...(init?.headers as Record<string, string> | undefined)
    }
  })
}

export async function internalHeaders(extra?: Record<string, string>) {
  const secret = process.env.INTERNAL_API_SECRET?.trim()
  if (!secret) {
    throw new Error('INTERNAL_API_SECRET is not configured')
  }

  // Read the current identity per request; unavailable OIDC must not block bearer-only targets.
  const token = process.env.VERCEL === '1' || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL_OIDC_TOKEN_FILE
    ? await getVercelOidcToken().catch(() => undefined)
    : undefined

  return {
    'Authorization': `Bearer ${secret}`,
    'content-type': 'application/json',
    ...(token && { 'x-vercel-trusted-oidc-idp-token': token }),
    ...extra
  }
}

const INTERNAL_FETCH_TIMEOUT_MS = 10_000

export async function internalFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await appFetch(path, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(INTERNAL_FETCH_TIMEOUT_MS),
    headers: {
      ...await internalHeaders(),
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
