import { describe, expect, it } from 'vitest'
import { buildIndex, parseLlmsIndex, searchIndex, splitSections, tokenize } from '../../layers/nuxi/agent/lib/docs-index'

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
  it('reads the v4 docs and deploy guides from llms.txt, and nothing else', () => {
    expect(parseLlmsIndex(LLMS).map(page => page.path)).toEqual([
      '/docs/4.x/getting-started/state-management',
      '/docs/4.x/api/composables/use-nuxt-app',
      '/deploy/cloudflare'
    ])
  })

  it('splits on h2 and h3 outside code fences', () => {
    const sections = splitSections(STATE.slice(STATE.indexOf('# State')))
    expect(sections.map(section => section.headings.join(' › '))).toEqual(['', 'Best Practices', 'Usage with Pinia'])
    expect(sections[1]!.text).toContain('// ## not a heading')
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

  it('falls back to the description when a page could not be fetched', () => {
    const index = buildIndex(parseLlmsIndex(LLMS), [null, null, null])
    expect(searchIndex(index, 'cloudflare', { limit: 1, perSectionChars: 500 })[0]?.path).toBe('/deploy/cloudflare')
  })
})
