import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DOCS_COLLECTION_VERSIONS, insertDocsVersion } from '../../shared/utils/docs'

describe('DOCS_COLLECTION_VERSIONS', () => {
  it('should key on collections declared in content.config.ts', () => {
    const config = readFileSync(fileURLToPath(new URL('../../content.config.ts', import.meta.url)), 'utf8')
    const collections = [...config.matchAll(/^ {4}(\w+): defineCollection\(/gm)].map(match => match[1])
    expect(collections).toContain('docsv4')
    for (const collection of Object.keys(DOCS_COLLECTION_VERSIONS)) {
      expect(collections).toContain(collection)
    }
  })
})

describe('insertDocsVersion', () => {
  it('should version markdown links', () => {
    expect(insertDocsVersion('see [intro](/docs/getting-started/introduction)', '5.x'))
      .toBe('see [intro](/docs/5.x/getting-started/introduction)')
  })

  it('should version quoted and unquoted MDC props', () => {
    expect(insertDocsVersion('::read-more{to="/docs/api/composables/use-fetch"}\n::', '3.x'))
      .toBe('::read-more{to="/docs/3.x/api/composables/use-fetch"}\n::')
    expect(insertDocsVersion(':read-more{to=\'/docs/api\'}', '4.x'))
      .toBe(':read-more{to=\'/docs/4.x/api\'}')
    expect(insertDocsVersion('::card{link="/docs/guide"}\n::', '4.x'))
      .toBe('::card{link="/docs/4.x/guide"}\n::')
    expect(insertDocsVersion(':read-more{to=/docs/getting-started/data-fetching}', '4.x'))
      .toBe(':read-more{to=/docs/4.x/getting-started/data-fetching}')
  })

  it('should leave already-versioned links alone', () => {
    const body = '[a](/docs/3.x/guide) and ::read-more{to="/docs/4.x/api"}'
    expect(insertDocsVersion(body, '5.x')).toBe(body)
  })

  it('should not rewrite asset paths, external docs URLs or prose', () => {
    const body = [
      '![diagram](/assets/docs/guide/rendering.svg)',
      '<img src="/assets/docs/getting-started/nuxt.png">',
      '[MDN](https://developer.mozilla.org/en-US/docs/Web/API/fetch)',
      'see https://chrome.com/docs/lighthouse and /assets/docs/foo.png',
      'use relative paths without the domain: `/docs/getting-started/installation`'
    ].join('\n')
    expect(insertDocsVersion(body, '5.x')).toBe(body)
  })
})
