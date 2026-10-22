export interface ShowcaseWebsite {
  name: string
  url: string
  industry?: string
}

export type ShowcaseVerdict = 'nuxt' | 'switched' | 'unverified'

export interface ShowcaseCheck {
  name: string
  url: string
  verdict: ShowcaseVerdict
  status?: number
  /** Final URL when redirects landed on another host. */
  redirectedTo?: string
  /** Best guess at what a `switched` site runs now. */
  framework?: string
  /** Why an `unverified` site could not be checked. */
  reason?: string
}

/**
 * Markers Nuxt 2, 3 and 4 put in server-rendered and SPA HTML alike. One is enough:
 * `buildAssetsDir`, `app.rootId` and `appId` are configurable, so a site may only keep some.
 */
const NUXT_MARKERS: RegExp[] = [
  /id="__NUXT_DATA__"|data-nuxt-data=/,
  /window\.__NUXT__\s*=/,
  /id="__nuxt"/,
  /["'(]\/_nuxt\//,
  /data-n-head/
]

const FRAMEWORK_HINTS: Array<[name: string, pattern: RegExp]> = [
  ['Next.js', /\/_next\/static\/|id="__NEXT_DATA__"|self\.__next_f/],
  ['Framer', /<meta[^>]+content="Framer\b|framerusercontent\.com/],
  ['Astro', /\/_astro\/|<astro-island/],
  ['SvelteKit', /\/_app\/immutable\/|__sveltekit_/],
  ['React Router', /__reactRouterContext|__remixContext/],
  ['Gatsby', /id="___gatsby"/],
  ['Webflow', /data-wf-page=|<meta[^>]+content="Webflow"/],
  ['Angular', /ng-version="/],
  ['Shopify', /cdn\.shopify\.com|Shopify\.theme/],
  ['WordPress', /\/wp-content\/|\/wp-includes\//]
]

const GENERATOR_META = /<meta[^>]+name="generator"[^>]+content="([^"]+)"/i

/** Bot-protection interstitials served with a 2xx status. */
const CHALLENGE_PAGE = /<title[^>]*>\s*(?:Just a moment|Access Denied|Attention Required|Request Rejected|Pardon Our Interruption|Verify you are (?:a )?human)|cf-chl-|_Incapsula_Resource|px-captcha|\/_sec\/cp_challenge/i

const HTML_CONTENT_TYPE = /^\s*(?:text\/html|application\/xhtml\+xml)\b/i
const HTML_DOCUMENT = /<(?:!doctype\s+html|html|head|body)\b/i

const MIN_PAGE_BYTES = 512
const MAX_PAGE_BYTES = 5 * 1024 * 1024

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const FETCH_TIMEOUT_MS = 15_000
const CONCURRENCY = 8

function detectFramework(html: string): string | undefined {
  const hint = FRAMEWORK_HINTS.find(([, pattern]) => pattern.test(html))
  if (hint) return hint[0]
  return GENERATOR_META.exec(html)?.[1]?.trim() || undefined
}

/**
 * A site only counts as `switched` when it served a real page without any Nuxt marker.
 * Blocked, failed and interstitial responses are `unverified`: bot protection on datacenter
 * IPs changes from one run to the next, and that says nothing about the stack.
 */
export function classifyShowcaseResponse({ status, html, contentType }: { status: number, html: string, contentType?: string }): Pick<ShowcaseCheck, 'verdict' | 'framework' | 'reason'> {
  if (NUXT_MARKERS.some(pattern => pattern.test(html))) {
    return { verdict: 'nuxt' }
  }
  if (status >= 400) {
    return { verdict: 'unverified', reason: `HTTP ${status}` }
  }
  if (CHALLENGE_PAGE.test(html)) {
    return { verdict: 'unverified', reason: 'bot challenge page' }
  }
  if ((contentType && !HTML_CONTENT_TYPE.test(contentType)) || !HTML_DOCUMENT.test(html)) {
    return { verdict: 'unverified', reason: `not an HTML page${contentType ? ` (${contentType.split(';')[0]!.trim()})` : ''}` }
  }
  if (html.length < MIN_PAGE_BYTES) {
    return { verdict: 'unverified', reason: 'empty page' }
  }
  return { verdict: 'switched', framework: detectFramework(html) }
}

function bareHost(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '')
}

/** Reads the body as text, or returns `undefined` once it grows past `maxBytes`. */
async function readCappedText(response: Response, maxBytes: number): Promise<string | undefined> {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let text = ''
  let bytes = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) return text + decoder.decode()
    bytes += value.byteLength
    if (bytes > maxBytes) {
      await reader.cancel()
      return undefined
    }
    text += decoder.decode(value, { stream: true })
  }
}

export async function checkShowcaseWebsite(website: ShowcaseWebsite, signal?: AbortSignal): Promise<ShowcaseCheck> {
  const base = { name: website.name, url: website.url }

  try {
    const response = await fetch(website.url, {
      redirect: 'follow',
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(FETCH_TIMEOUT_MS)]) : AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'user-agent': USER_AGENT,
        'accept': 'text/html,application/xhtml+xml',
        'accept-language': 'en-GB,en;q=0.9'
      }
    })
    const contentType = response.headers.get('content-type') ?? undefined
    const redirectedTo = response.url && bareHost(response.url) !== bareHost(website.url) ? response.url : undefined
    const result = { ...base, status: response.status, ...(redirectedTo ? { redirectedTo } : {}) }

    let html = ''
    if (contentType && !HTML_CONTENT_TYPE.test(contentType)) {
      await response.body?.cancel()
    } else {
      const text = await readCappedText(response, MAX_PAGE_BYTES)
      if (text === undefined) {
        return { ...result, verdict: 'unverified', reason: `page larger than ${MAX_PAGE_BYTES / 1024 / 1024} MB` }
      }
      html = text
    }

    return { ...result, ...classifyShowcaseResponse({ status: response.status, html, contentType }) }
  } catch (error) {
    if (signal?.aborted) throw signal.reason ?? error
    const cause = (error as { cause?: { code?: string } }).cause?.code
    const reason = cause ?? (error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : String(error))
    return { ...base, verdict: 'unverified', reason }
  }
}

export async function checkShowcaseWebsites(websites: ShowcaseWebsite[], signal?: AbortSignal): Promise<ShowcaseCheck[]> {
  const results: ShowcaseCheck[] = []
  let next = 0

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, websites.length) }, async () => {
    while (next < websites.length) {
      signal?.throwIfAborted()
      const index = next++
      results[index] = await checkShowcaseWebsite(websites[index]!, signal)
    }
  }))

  return results
}
