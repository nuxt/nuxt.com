import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkShowcaseWebsite, classifyShowcaseResponse } from '../../layers/nuxi/agent/lib/showcase/check'

const filler = `<p>${'Lorem ipsum dolor sit amet. '.repeat(40)}</p>`

function page(head: string, body = '') {
  return `<!DOCTYPE html><html><head>${head}</head><body>${filler}${body}</body></html>`
}

describe('classifyShowcaseResponse', () => {
  it('confirms a Nuxt 3+ page from its payload', () => {
    const html = page('<link rel="modulepreload" href="/_nuxt/entry.js">', '<div id="__nuxt"></div><script type="application/json" data-nuxt-data="nuxt-app" data-ssr="true" id="__NUXT_DATA__">[]</script>')
    expect(classifyShowcaseResponse({ status: 200, html })).toEqual({ verdict: 'nuxt' })
  })

  it('confirms a Nuxt 2 page', () => {
    const html = page('<meta data-n-head="ssr" charset="utf-8">', '<script>window.__NUXT__=(function(a){return {}}(1))</script>')
    expect(classifyShowcaseResponse({ status: 200, html })).toEqual({ verdict: 'nuxt' })
  })

  it('confirms a site with a custom build directory and root id from its payload alone', () => {
    const html = page('', '<div id="app"></div><script type="application/json" id="__NUXT_DATA__">[]</script>')
    expect(classifyShowcaseResponse({ status: 200, html })).toEqual({ verdict: 'nuxt' })
  })

  it('confirms an error page rendered by Nuxt', () => {
    const html = page('', '<div id="__nuxt"></div><script>window.__NUXT__={}</script>')
    expect(classifyShowcaseResponse({ status: 403, html })).toEqual({ verdict: 'nuxt' })
  })

  it('reports a Next.js site as switched', () => {
    const html = page('<script src="/_next/static/chunks/main.js"></script>', '<div id="__next"></div>')
    expect(classifyShowcaseResponse({ status: 200, html })).toEqual({ verdict: 'switched', framework: 'Next.js' })
  })

  it('does not mistake a page that mentions Nuxt for a Nuxt site', () => {
    const html = page('<meta name="generator" content="Framer 4c7be26">', '<h2>Works with Nuxt, Next and Astro</h2>')
    expect(classifyShowcaseResponse({ status: 200, html })).toEqual({ verdict: 'switched', framework: 'Framer' })
  })

  it('falls back to the generator meta tag', () => {
    const html = page('<meta name="generator" content="Hugo 0.140">')
    expect(classifyShowcaseResponse({ status: 200, html })).toEqual({ verdict: 'switched', framework: 'Hugo 0.140' })
  })

  it('leaves the framework empty when nothing is recognisable', () => {
    expect(classifyShowcaseResponse({ status: 200, html: page('') })).toEqual({ verdict: 'switched', framework: undefined })
  })

  it('never reports a blocked request as switched', () => {
    const html = page('<title>Attention Required! | Cloudflare</title>')
    expect(classifyShowcaseResponse({ status: 403, html })).toEqual({ verdict: 'unverified', reason: 'HTTP 403' })
    expect(classifyShowcaseResponse({ status: 429, html: '' })).toEqual({ verdict: 'unverified', reason: 'HTTP 429' })
  })

  it('treats a challenge served with a 200 as unverified', () => {
    const html = page('<title>Just a moment...</title>', '<script src="/cdn-cgi/challenge-platform/h/b/orchestrate/chl_page/v1"></script>')
    expect(classifyShowcaseResponse({ status: 200, html })).toEqual({ verdict: 'unverified', reason: 'bot challenge page' })
  })

  it('treats a near-empty page as unverified', () => {
    expect(classifyShowcaseResponse({ status: 200, html: '<html><body></body></html>' })).toEqual({ verdict: 'unverified', reason: 'empty page' })
  })
})

describe('checkShowcaseWebsite', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reports a redirect to another host', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      status: 200,
      url: 'https://directus.com/',
      text: async () => page('<meta name="generator" content="Framer 4c7be26">')
    })))

    expect(await checkShowcaseWebsite({ name: 'Directus', url: 'https://directus.io/' })).toEqual({
      name: 'Directus',
      url: 'https://directus.io/',
      status: 200,
      redirectedTo: 'https://directus.com/',
      verdict: 'switched',
      framework: 'Framer'
    })
  })

  it('ignores a redirect that only adds or drops www', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      status: 200,
      url: 'https://www.upwork.com/',
      text: async () => page('', '<div id="__nuxt"></div>')
    })))

    expect(await checkShowcaseWebsite({ name: 'Upwork', url: 'https://upwork.com/' })).toEqual({
      name: 'Upwork',
      url: 'https://upwork.com/',
      status: 200,
      verdict: 'nuxt'
    })
  })

  it('reports network failures as unverified', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } })
    }))

    expect(await checkShowcaseWebsite({ name: 'Gone', url: 'https://gone.example/' })).toEqual({
      name: 'Gone',
      url: 'https://gone.example/',
      verdict: 'unverified',
      reason: 'ENOTFOUND'
    })
  })
})
