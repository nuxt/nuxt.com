import { expect, test } from '@nuxt/test-utils/playwright'

const baseURL = process.env.BASE_URL || 'https://nuxt.com'

const url = (path: string) => new URL(path, baseURL).toString()

/**
 * Absolute links in the discovery documents are built from the site's canonical
 * origin, which is not the host the suite is pointed at on a preview
 * deployment. Assert on the path and let the origin be whatever it is.
 */
const path = (value: string) => new RegExp(`https?://[^\\s)>"']+${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)

/** A path that cannot exist, so the 404 is the site's and not a stale route. */
const MISSING = '/this-path-does-not-exist-4f2c9'

test.describe('Agent crawlers', () => {
  // The homepage must answer every agent negotiation knows about. A block here
  // is invisible in a browser and only shows up as a missing site in an
  // assistant's answer. The last four came with nuxt-agent-discovery 0.5.0.
  const agents = [
    'ChatGPT-User/1.0',
    'ClaudeBot/1.0',
    'Claude-User/1.0',
    'PerplexityBot/1.0',
    'Perplexity-User/1.0',
    'Google-Extended',
    'DeepSeekBot/1.0',
    'CCBot/2.0'
  ]

  for (const userAgent of agents) {
    test(`${userAgent} reaches the homepage and gets markdown`, async ({ request }) => {
      const response = await request.get(url('/'), { headers: { 'user-agent': userAgent } })
      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain('text/markdown')
      expect(await response.text()).toContain('# ')
    })
  }

  test('a markdown twin points back at the page it represents', async ({ request }) => {
    // The `Link` pair is what lets an agent that landed on the markdown find
    // the canonical HTML URL. It is emitted at the origin and, since
    // nuxt-agent-discovery 0.4.0, on a CDN hit as well.
    const page = '/docs/4.x/getting-started/introduction'
    const response = await request.get(url(`/raw${page}.md`))
    expect(response.status()).toBe(200)

    const link = response.headers()['link'] ?? ''
    expect(link).toMatch(new RegExp(`<https?://[^>]+${page}>; rel="canonical"`))
    expect(link).toMatch(new RegExp(`<https?://[^>]+${page}>; rel="alternate"; type="text/html"`))
    expect(response.headers()['vary']).toContain('Accept')
  })

  test('robots.txt allows the agents negotiation knows about', async ({ request }) => {
    const robots = await (await request.get(url('/robots.txt'))).text()

    // Preview and development deployments are served a blanket disallow by
    // @nuxtjs/robots, which has no per-agent groups to check.
    test.skip(robots.includes('indexing disabled'), 'indexing is disabled on this deployment')

    for (const agent of ['ClaudeBot', 'Claude-User', 'GPTBot', 'ChatGPT-User', 'Google-Extended', 'DeepSeekBot', 'PerplexityBot', 'Perplexity-User', 'CCBot']) {
      expect(robots, agent).toContain(`User-agent: ${agent}\nAllow: /`)
    }
    expect(robots).toMatch(path('/sitemap.xml'))
  })
})

test.describe('Agent-friendly errors', () => {
  test('a missing path is a real 404 with a markdown recovery body', async ({ request }) => {
    const response = await request.get(url(MISSING), { headers: { accept: 'text/markdown' } })
    expect(response.status()).toBe(404)
    expect(response.headers()['content-type']).toContain('text/markdown')

    const body = await response.text()
    expect(body).toContain('status: 404')
    expect(body).toMatch(path('/sitemap.md'))
    expect(body).toMatch(path('/llms.txt'))
  })

  test('the HTML 404 carries the same recovery links', async ({ page, goto }) => {
    const response = await goto(MISSING)
    expect(response?.status()).toBe(404)

    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Documentation' }).first()).toBeVisible()

    // Rendered from the discovery registry, so assert the documents an agent
    // recovers through rather than the whole list, which the registry owns.
    for (const document of ['sitemap.md', 'llms.txt', 'openapi.json']) {
      await expect(page.getByRole('link', { name: document, exact: true })).toBeVisible()
    }
  })
})

test.describe('Agent instructions', () => {
  test('llms.txt says when to use the docs before it lists them', async ({ request }) => {
    const body = await (await request.get(url('/llms.txt'))).text()
    const details = body.slice(0, body.indexOf('\n## '))

    expect(details).toMatch(/^# /)
    expect(details).toContain('Reach for these docs when')
    expect(details).toContain('Accept: text/markdown')
    expect(details).toMatch(path('/mcp'))
    // The details slot sits between the blockquote and the first `## `.
    expect(details.split('\n').filter(line => line.startsWith('#')).length).toBe(1)
  })

  test('the agent homepage repeats the guidance as a section', async ({ request }) => {
    const body = await (await request.get(url('/raw/index.md'))).text()
    expect(body).toContain('## When to use this')
    expect(body).toContain('Reach for these docs when')
  })
})
