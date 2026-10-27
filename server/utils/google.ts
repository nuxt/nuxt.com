const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

let cachedToken: { value: string, expiresAt: number } | undefined

function base64url(input: string | ArrayBuffer): string {
  return Buffer.from(typeof input === 'string' ? input : new Uint8Array(input)).toString('base64url')
}

/** Rethrows a Google API error as an H3 error carrying Google's message, so MCP clients see why it failed. */
function throwGoogleError(error: unknown, api: string): never {
  const { statusCode, data } = error as { statusCode?: number, data?: { error?: string | { message?: string }, error_description?: string } }
  const googleError = data?.error_description || (typeof data?.error === 'string' ? data.error : data?.error?.message)
  if (!googleError) throw error
  throw createError({ statusCode: statusCode || 502, message: `${api}: ${googleError}` })
}

let pendingToken: Promise<string> | undefined

/**
 * Returns an OAuth access token for the service account, cached until a minute before expiry.
 * Concurrent tool calls share one in-flight exchange; a failed one is not kept, so the next call retries.
 */
function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return Promise.resolve(cachedToken.value)
  pendingToken ??= requestAccessToken(clientEmail, privateKey).finally(() => {
    pendingToken = undefined
  })
  return pendingToken
}

/** Exchanges a signed service-account JWT for an OAuth access token. */
async function requestAccessToken(clientEmail: string, privateKey: string): Promise<string> {
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
    throwGoogleError(error, 'Google Search Console')
  }
}

/**
 * Queries the Chrome UX Report API (`records:queryRecord` or `records:queryHistoryRecord`) with
 * `NUXT_GOOGLE_CRUX_API_KEY`. Returns `undefined` when CrUX has no data for the URL or origin
 * (not enough Chrome traffic), which Google reports as a 404.
 */
export async function cruxFetch<T>(method: 'queryRecord' | 'queryHistoryRecord', body: Record<string, unknown>): Promise<T | undefined> {
  const { apiKey } = useRuntimeConfig().googleCrux
  if (!apiKey) {
    throw createError({ statusCode: 503, message: 'Chrome UX Report is not configured (NUXT_GOOGLE_CRUX_API_KEY).' })
  }

  try {
    return await $fetch<T>(`https://chromeuxreport.googleapis.com/v1/records:${method}`, { method: 'POST', query: { key: apiKey }, body })
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode === 404) return undefined
    throwGoogleError(error, 'Chrome UX Report')
  }
}
