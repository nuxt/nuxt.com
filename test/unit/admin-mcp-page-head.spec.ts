import { createError } from 'h3'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn<(url: URL, init: RequestInit) => Promise<Response>>()
vi.stubGlobal('fetch', fetchMock)
vi.stubGlobal('defineMcpTool', <T>(definition: T) => definition)
vi.stubGlobal('createError', createError)
vi.stubGlobal('isMcpAdmin', () => true)

const pageHead = (await import('../../server/mcp/tools/admin/page-head')).default as unknown as {
  handler: (input: { url: string }) => Promise<Record<string, any>>
}

const html = (body: string, status = 200) => new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8' } })
const redirect = (location: string, status = 301) => new Response(null, { status, headers: { location } })
/** Answers each URL from a map, so a test fails on any request it did not expect. */
function serve(pages: Record<string, () => Response>) {
  fetchMock.mockImplementation(async (url) => {
    const page = pages[url.href]
    if (!page) throw new Error(`Unexpected request to ${url.href}`)
    return page()
  })
}

beforeEach(() => {
  // Braces matter: Vitest would call a returned mock as this hook's teardown.
  fetchMock.mockReset()
})
afterAll(() => vi.unstubAllGlobals())

describe('admin page-head tool', () => {
  it('refuses every host outside nuxt.com before making a request', async () => {
    for (const url of ['https://nuxt.com.evil.com/', 'https://notnuxt.com/', '//evil.com/docs', 'https://ui.nuxtXcom/', 'https://nuxt.com:8443/', 'https://admin@nuxt.com/', 'ftp://nuxt.com/']) {
      await expect(pageHead.handler({ url }), url).rejects.toMatchObject({ statusCode: 400 })
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('follows a moved subdomain page to nuxt.com and reads the tags of the page it lands on', async () => {
    serve({
      'https://devtools.nuxt.com/guide/features': () => redirect('https://nuxt.com/modules/devtools/features'),
      // A relative `Location` resolves against the URL that sent it
      'https://nuxt.com/modules/devtools/features': () => redirect('/modules/devtools/features/', 308),
      'https://nuxt.com/modules/devtools/features/': () => html(`<!DOCTYPE html><html><head>
        <!-- <title>Commented out</title> </head> -->
        <script type="application/ld+json">{"description":"<meta name=\\"description\\" content=\\"From JSON-LD\\"></head>"}</script>
        <title>Features · @nuxt&#x2F;devtools &amp; Nuxt
          Modules</title>
        <meta content='Inspect pages > components &amp; payload.' name="description">
        <meta name="description" content="A duplicate that crawlers ignore">
        <meta property="og:description" content="Open Graph copy">
        <meta name=robots content="index, follow">
        <link rel="alternate" type="text/markdown" href="https://nuxt.com/raw/modules/devtools/features.md">
        <link href="https://nuxt.com/modules/devtools/features" rel="canonical">
      </head><body><meta name="robots" content="noindex"><title>Body title</title></body></html>`)
    })

    await expect(pageHead.handler({ url: 'https://devtools.nuxt.com/guide/features' })).resolves.toEqual({
      url: 'https://devtools.nuxt.com/guide/features',
      redirects: [
        { from: 'https://devtools.nuxt.com/guide/features', status: 301, to: 'https://nuxt.com/modules/devtools/features' },
        { from: 'https://nuxt.com/modules/devtools/features', status: 308, to: 'https://nuxt.com/modules/devtools/features/' }
      ],
      finalUrl: 'https://nuxt.com/modules/devtools/features/',
      status: 200,
      title: 'Features · @nuxt/devtools & Nuxt Modules',
      description: 'Inspect pages > components & payload.',
      canonical: 'https://nuxt.com/modules/devtools/features',
      robots: 'index, follow',
      xRobotsTag: null
    })
    expect(fetchMock.mock.calls.every(([, init]) => init.redirect === 'manual')).toBe(true)
  })

  it('reports a redirect that leaves nuxt.com without fetching its target', async () => {
    serve({ 'https://nuxt.com/chat': () => redirect('https://example.com/landing', 302) })

    const result = await pageHead.handler({ url: '/chat' })

    expect(result).toMatchObject({
      redirects: [{ from: 'https://nuxt.com/chat', status: 302, to: 'https://example.com/landing' }],
      finalUrl: 'https://example.com/landing',
      status: null
    })
    expect(result.note).toContain('outside nuxt.com')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('stops on a redirect loop', async () => {
    serve({
      'https://nuxt.com/a': () => redirect('/b'),
      'https://nuxt.com/b': () => redirect('/a')
    })

    const result = await pageHead.handler({ url: '/a' })

    expect(result.redirects).toHaveLength(5)
    expect(result.status).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(5)
  })

  it.each([
    ['a comment', ['<html><head><!-- old markup: </head>', ' --><title>Live title</title></head>'], { title: 'Live title' }],
    ['an attribute value', ['<html><head><meta name="description" content="What does </head>', ' do?"><title>Live title</title></head>'], { title: 'Live title', description: 'What does </head> do?' }],
    ['a title', ['<html><head><title>Closing </head>', ' tags</title><meta name="robots" content="noindex"></head>'], { title: 'Closing </head> tags', robots: 'noindex' }]
  ])('keeps reading when a chunk ends inside %s that quotes the end of the head', async (_where, head, tags) => {
    const chunks = [...head, '<body><title>Never read</title></body></html>']
    let sent = 0
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (sent === chunks.length) return controller.close()
        controller.enqueue(new TextEncoder().encode(chunks[sent++]))
      }
    }, { highWaterMark: 0 })
    serve({ 'https://nuxt.com/changelog': () => new Response(body, { headers: { 'content-type': 'text/html' } }) })

    await expect(pageHead.handler({ url: '/changelog' })).resolves.toMatchObject({ status: 200, ...tags })
    // The body is left unread once the head has closed
    expect(sent).toBe(2)
  })

  it('still reads the tags after a tag that never closes', async () => {
    const html = '<html><head><meta name="generator" content=it\'s><title>Live title</title></head><body></body></html>'
    serve({ 'https://nuxt.com/changelog': () => new Response(html, { headers: { 'content-type': 'text/html' } }) })

    await expect(pageHead.handler({ url: '/changelog' })).resolves.toMatchObject({ status: 200, title: 'Live title' })
  })

  it('returns the status without tags when the page does not exist', async () => {
    const notFound = html('<html><head><title>404 - Page not found</title></head></html>', 404)
    notFound.headers.set('x-robots-tag', 'noindex')
    serve({ 'https://nuxt.com/modules/devtools/faq': () => notFound })

    await expect(pageHead.handler({ url: '/modules/devtools/faq' })).resolves.toEqual({
      url: 'https://nuxt.com/modules/devtools/faq',
      redirects: [],
      finalUrl: 'https://nuxt.com/modules/devtools/faq',
      status: 404,
      title: null,
      description: null,
      canonical: null,
      robots: null,
      xRobotsTag: 'noindex'
    })
  })
})
