import { describe, expect, it } from 'vitest'
import { githubRefTag } from '../../server/utils/content/cache'

describe('githubRefTag', () => {
  const key = 'repo:nuxt%2Fnuxt:branch:tmp%2Fcomark-content-migration:path:docs'

  it('is deterministic for the same key', () => {
    expect(githubRefTag(key)).toBe(githubRefTag(key))
  })

  it('differs for different keys', () => {
    expect(githubRefTag('repo:nuxt%2Fnuxt:branch:4.x:path:docs'))
      .not.toBe(githubRefTag('repo:nuxt%2Fcli:branch:4.x:path:docs'))
  })

  it('uses a charset untouched by percent-encoding, so it cannot need decoding', () => {
    expect(githubRefTag(key)).toMatch(/^[\w-]+$/)
  })

  it('survives the header-write / query-read round trip unchanged — the property the bug violated', () => {
    const written = githubRefTag(key) // sent verbatim in a header on write (build-client.js:84)

    const url = new URL(`https://example.com/revalidate?tags=${written}`)
    expect(url.searchParams.get('tags')).toBe(written)
  })
})
