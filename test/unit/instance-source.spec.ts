import { describe, expect, it } from 'vitest'
import { CONTENT_INSTANCE_KEYS } from '../../shared/utils/content'
import { instanceSource } from '../../server/utils/content/instances'

/**
 * comark-content validates the instance name it is given positionally, and throws at construction
 * on anything else. Mirrored from `INSTANCE_NAME` in comark-content's `content.js` (not exported).
 */
// eslint-disable-next-line regexp/prefer-w, regexp/use-ignore-case -- kept byte-identical to upstream so it can be diffed
const INSTANCE_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/

describe('instanceSource', () => {
  it('describes every instance the site serves', () => {
    expect(CONTENT_INSTANCE_KEYS.length).toBeGreaterThan(0)
    for (const key of CONTENT_INSTANCE_KEYS) {
      expect(() => instanceSource(key), key).not.toThrow()
    }
  })

  it('names every instance with a valid comark-content identifier', () => {
    for (const key of CONTENT_INSTANCE_KEYS) {
      expect(instanceSource(key).name, key).toMatch(INSTANCE_NAME)
    }
  })

  it('gives every instance a repo, a branch and a content directory', () => {
    for (const key of CONTENT_INSTANCE_KEYS) {
      const { source } = instanceSource(key)
      expect(source.repo, key).toMatch(/^[\w.-]+\/[\w.-]+$/)
      expect(source.branch, key).toBeTruthy()
      expect(source.contentDir, key).toBeTruthy()
    }
  })

  it('mounts every instance under an absolute prefix', () => {
    for (const key of CONTENT_INSTANCE_KEYS) {
      expect(instanceSource(key).source.prefix, key).toMatch(/^\//)
    }
  })

  it('rejects an unknown instance key', () => {
    expect(() => instanceSource('docs:9.x' as never)).toThrow()
  })
})
