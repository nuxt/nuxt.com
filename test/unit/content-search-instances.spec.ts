import { describe, expect, it } from 'vitest'
import { isContentInstanceKey, searchInstanceKeys, SEARCH_INDEXED_KEYS } from '../../shared/utils/content'
import { DOC_VERSIONS } from '../../shared/utils/docs'
import { instanceSource } from '../../server/utils/content/instances'

describe('searchInstanceKeys', () => {
  it('names every instance the browser search hub composes, for every version', () => {
    for (const version of DOC_VERSIONS) {
      const keys = searchInstanceKeys(version)
      expect(keys.length).toBeGreaterThan(0)
      for (const key of keys) {
        expect(isContentInstanceKey(key), key).toBe(true)
      }
    }
  })

  it('gives every composed instance a unique name — contentHub() throws on a duplicate', () => {
    // `docs:*` and `cli:*` are all named `docs`/`cli` respectively across versions; a hub only
    // works because one version's set never repeats a name (`examples` is shared, not versioned).
    for (const version of DOC_VERSIONS) {
      const names = searchInstanceKeys(version).map(key => instanceSource(key).name)
      expect(new Set(names).size, version).toBe(names.length)
    }
  })
})

describe('SEARCH_INDEXED_KEYS', () => {
  it('covers every instance every version\'s search palette reads', () => {
    for (const version of DOC_VERSIONS) {
      for (const key of searchInstanceKeys(version)) {
        expect(SEARCH_INDEXED_KEYS.has(key), key).toBe(true)
      }
    }
  })

  it('does not indiscriminately cover the whole registry', () => {
    expect(SEARCH_INDEXED_KEYS.has('site')).toBe(false)
  })
})
