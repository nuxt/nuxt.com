import { describe, expect, it } from 'vitest'
import { hashManifestItem, stableStringify } from '../../server/utils/content/json'
import type { ContentListFile } from 'comark-content'

const item = (data: Record<string, unknown>, path = '/blog/hello'): ContentListFile =>
  ({ path, data } as unknown as ContentListFile)

describe('stableStringify', () => {
  it('is independent of object key order', () => {
    expect(stableStringify({ a: 1, b: 2 })).toBe(stableStringify({ b: 2, a: 1 }))
  })

  it('sorts nested keys too', () => {
    expect(stableStringify({ outer: { z: 1, a: 2 } })).toBe(stableStringify({ outer: { a: 2, z: 1 } }))
  })

  it('keeps array order significant', () => {
    expect(stableStringify([1, 2])).not.toBe(stableStringify([2, 1]))
  })

  it('round-trips primitives and null', () => {
    expect(stableStringify(null)).toBe('null')
    expect(stableStringify(undefined)).toBe('null')
    expect(stableStringify('a')).toBe('"a"')
    expect(stableStringify(3)).toBe('3')
  })
})

describe('hashManifestItem', () => {
  // The regression this guards: with `JSON.stringify`, reordering frontmatter marked the whole
  // instance's navigation as changed and purged every one of its pages.
  it('ignores a cosmetic frontmatter reorder', () => {
    const before = item({ title: 'Hello', description: 'World' })
    const after = item({ description: 'World', title: 'Hello' })

    expect(hashManifestItem(before)).toBe(hashManifestItem(after))
  })

  it('still notices a changed listing value', () => {
    expect(hashManifestItem(item({ title: 'Hello' }))).not.toBe(hashManifestItem(item({ title: 'Goodbye' })))
  })

  it('treats a missing item and missing data as empty', () => {
    expect(hashManifestItem(undefined)).toBe('')
    expect(hashManifestItem(item(undefined as unknown as Record<string, unknown>))).toBe('{}')
  })
})
