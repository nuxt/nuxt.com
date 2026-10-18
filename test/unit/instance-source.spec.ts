import { afterEach, describe, expect, it, vi } from 'vitest'
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

  describe('site ref', () => {
    const SHA = 'a'.repeat(40)

    afterEach(() => vi.unstubAllEnvs())

    it('reads main in production', () => {
      vi.stubEnv('VERCEL_ENV', 'production')
      vi.stubEnv('VERCEL_GIT_COMMIT_SHA', SHA)
      expect(instanceSource('site').source.branch).toBe('main')
    })

    it('reads the built commit on a preview, so its code and content match', () => {
      vi.stubEnv('VERCEL_ENV', 'preview')
      vi.stubEnv('VERCEL_GIT_COMMIT_SHA', SHA)
      expect(instanceSource('site').source.branch).toBe(SHA)
    })

    it('lets NUXT_COM_BRANCH override the preview commit', () => {
      vi.stubEnv('VERCEL_ENV', 'preview')
      vi.stubEnv('VERCEL_GIT_COMMIT_SHA', SHA)
      vi.stubEnv('NUXT_COM_BRANCH', 'feat/x')
      expect(instanceSource('site').source.branch).toBe('feat/x')
    })

    it('leaves other instances on their branch', () => {
      vi.stubEnv('VERCEL_ENV', 'preview')
      vi.stubEnv('VERCEL_GIT_COMMIT_SHA', SHA)
      expect(instanceSource('examples').source.branch).toBe('main')
    })
  })
})
