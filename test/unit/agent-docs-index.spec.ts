import { describe, expect, it, vi } from 'vitest'
import { buildIndex, getDocsIndex, parseLlmsIndex, searchIndex, splitSections, tokenize } from '../../layers/nuxi/agent/lib/docs-index'

const LLMS = `# Nuxt Docs

## Documentation Sets

- [Nuxt v3](https://nuxt.com/raw/docs/3.x/getting-started/introduction.md): Old docs.

## Nuxt v4 Documentation

- [State Management](https://nuxt.com/raw/docs/4.x/getting-started/state-management.md): Shared state with useState.
- [useNuxtApp](https://nuxt.com/raw/docs/4.x/api/composables/use-nuxt-app.md): Access the Nuxt app context.

## Deployment Guides

- [Cloudflare](https://nuxt.com/raw/deploy/cloudflare.md): Deploy to Cloudflare.

## Blog

- [Nuxt 4](https://nuxt.com/raw/blog/v4.md): Announcing Nuxt 4.

## Nuxt Icon Documentation

- [Configuration](https://nuxt.com/raw/modules/icon/configuration.md): Every option of the icon key in your Nuxt config.
`

const STATE = `---
title: "State Management"
---
# State Management

> Shared state with useState.

## Best Practices

Never define \`const state = ref()\` outside of setup: it leaks state across requests on the server.

\`\`\`ts
// ## not a heading
export const useUser = () => useState('user', () => null)
\`\`\`

## Usage with Pinia

Install \`@pinia/nuxt\` to use Pinia stores.
`

const NUXT_APP = `# useNuxtApp

## runWithContext

Calling a composable after an await throws "Nuxt instance unavailable". Wrap it in \`nuxtApp.runWithContext\`.
`

const CLOUDFLARE = `# Cloudflare

## Cloudflare Pages

Deploy with the \`cloudflare_pages\` preset.
`

describe('docs index', () => {
  it('reads the v4 docs, deploy guides and hosted module docs from llms.txt, and nothing else', () => {
    expect(parseLlmsIndex(LLMS).map(page => page.path)).toEqual([
      '/docs/4.x/getting-started/state-management',
      '/docs/4.x/api/composables/use-nuxt-app',
      '/deploy/cloudflare',
      '/modules/icon/configuration'
    ])
  })

  it('splits on h2 and h3 outside code fences', () => {
    const sections = splitSections(STATE.slice(STATE.indexOf('# State')))
    expect(sections.map(section => section.headings.join(' › '))).toEqual(['', 'Best Practices', 'Usage with Pinia'])
    expect(sections[1]!.text).toContain('// ## not a heading')
  })

  it('only closes a fence on a matching marker', () => {
    const markdown = ['## Writing docs', '````md', '```ts', '## not a heading', '```', '````', '~~~', '```', '## still code', '~~~', '## After']
      .join('\n')
    expect(splitSections(markdown).map(section => section.headings.join())).toEqual(['Writing docs', 'After'])
  })

  it('closes a fence cut off by truncation with the opening marker', () => {
    const body = `## Long\n\n~~~~ts\n${'const a = 1\n'.repeat(80)}~~~~\n`
    const index = buildIndex(parseLlmsIndex(LLMS), [body, null, null])
    const [hit] = searchIndex(index, 'long', { limit: 1, perSectionChars: 200 })
    expect(hit?.content).toMatch(/\n~~~~\n…$/)
  })

  it('splits camelCase identifiers and pairs adjacent words', () => {
    expect(tokenize('useAsyncData')).toEqual(expect.arrayContaining(['useasyncdata', 'async', 'data']))
    expect(tokenize('Nuxt instance unavailable')).toContain('instance+unavailable')
  })

  it('ranks the section that answers the question first, with an anchor link', () => {
    const pages = parseLlmsIndex(LLMS)
    const index = buildIndex(pages, [STATE, NUXT_APP, CLOUDFLARE])

    const [hit] = searchIndex(index, 'nuxt instance unavailable', { limit: 3, perSectionChars: 500 })
    expect(hit).toMatchObject({ path: '/docs/4.x/api/composables/use-nuxt-app', url: '/docs/4.x/api/composables/use-nuxt-app#runwithcontext' })

    const [state] = searchIndex(index, 'state leak between requests', { limit: 3, perSectionChars: 500 })
    expect(state?.section).toBe('Best Practices')

    expect(searchIndex(index, 'pinia', { limit: 3, perSectionChars: 500, prefix: '/deploy/' })).toEqual([])
  })

  it('runs one background refresh at a time once the index is stale', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    let llmsFetches = 0
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('/llms.txt')) llmsFetches++
      return new Response(url.endsWith('/llms.txt') ? LLMS : NUXT_APP)
    }))
    try {
      const first = await getDocsIndex()
      expect(llmsFetches).toBe(1)

      vi.setSystemTime(Date.now() + 2 * 60 * 60 * 1000)
      const during = await Promise.all([getDocsIndex(), getDocsIndex(), getDocsIndex()])
      expect(during.every(index => index === first)).toBe(true)
      await vi.waitFor(async () => expect(await getDocsIndex()).not.toBe(first))
      expect(llmsFetches).toBe(2)
    } finally {
      vi.unstubAllGlobals()
      vi.useRealTimers()
    }
  })

  it('falls back to the description when a page could not be fetched', () => {
    const index = buildIndex(parseLlmsIndex(LLMS), [null, null, null])
    expect(searchIndex(index, 'cloudflare', { limit: 1, perSectionChars: 500 })[0]?.path).toBe('/deploy/cloudflare')
  })
})
