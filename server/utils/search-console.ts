const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

let cachedToken: { value: string, expiresAt: number } | undefined

function base64url(input: string | ArrayBuffer): string {
  return Buffer.from(typeof input === 'string' ? input : new Uint8Array(input)).toString('base64url')
}

/** Exchanges a service-account JWT for an OAuth access token, cached until a minute before expiry. */
async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value

  // Env vars usually hold the PEM with escaped newlines.
  const pem = privateKey.replace(/\\n/g, '\n').replace(/-----(BEGIN|END) PRIVATE KEY-----|\s/g, '')
  const key = await crypto.subtle.importKey('pkcs8', Buffer.from(pem, 'base64'), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])

  const iat = Math.floor(Date.now() / 1000)
  const unsigned = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(JSON.stringify({ iss: clientEmail, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600 }))}`
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned))

  const { access_token, expires_in } = await $fetch<{ access_token: string, expires_in: number }>(TOKEN_URL, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${base64url(signature)}`
    })
  })
  cachedToken = { value: access_token, expiresAt: Date.now() + expires_in * 1000 }
  return access_token
}

/**
 * Calls the Google Search Console API as the configured service account
 * (`NUXT_GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL` / `_PRIVATE_KEY`), which must be
 * added as a user of the `siteUrl` property in Search Console.
 *
 * `path` may contain `{siteUrl}`, replaced with the URL-encoded property.
 */
export async function searchConsoleFetch<T>(path: string, options: { method?: 'GET' | 'POST', body?: Record<string, unknown> } = {}): Promise<T> {
  const { clientEmail, privateKey, siteUrl } = useRuntimeConfig().googleSearchConsole
  if (!clientEmail || !privateKey) {
    throw createError({ statusCode: 503, message: 'Google Search Console is not configured (NUXT_GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL / NUXT_GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY).' })
  }

  try {
    const token = await getAccessToken(clientEmail, privateKey)
    return await $fetch<T>(`https://searchconsole.googleapis.com${path.replace('{siteUrl}', encodeURIComponent(siteUrl))}`, {
      ...options,
      headers: { authorization: `Bearer ${token}` }
    })
  } catch (error) {
    const { statusCode, data } = error as { statusCode?: number, data?: { error?: string | { message?: string }, error_description?: string } }
    const googleError = data?.error_description || (typeof data?.error === 'string' ? data.error : data?.error?.message)
    if (!googleError) throw error
    throw createError({ statusCode: statusCode || 502, message: `Google Search Console: ${googleError}` })
  }
}
