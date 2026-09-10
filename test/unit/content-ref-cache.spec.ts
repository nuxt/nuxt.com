import { createError } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Driver } from 'unstorage'
import { fetchLastContentCommit, normalizeContentDir } from '../../server/utils/content/commits'

const SHA = (char: string) => char.repeat(40)

/** Every write, with the TTL it carried — the thing this cache's behaviour turns on. */
const writes: { key: string, value: unknown, ttl?: number }[] = []
const store = new Map<string, unknown>()

/** A memory driver that records the TTL each write asked for. */
const recordingDriver = (): Driver => ({
  name: 'recording',
  getItem: key => store.get(key) ?? null,
  setItem: (key, value, opts) => {
    writes.push({ key, value, ttl: (opts as { ttl?: number } | undefined)?.ttl })
    store.set(key, value)
  },
  removeItem: key => void store.delete(key),
  getKeys: () => [...store.keys()],
  clear: () => store.clear(),
  dispose: () => {}
})

/** `refs.ts` reaches for these through Nitro's auto-imports. */
function stubAutoImports() {
  vi.stubGlobal('createError', createError)
  vi.stubGlobal('useRuntimeConfig', () => ({ github: { token: 'tok' } }))
  vi.stubGlobal('githubRefCacheDriver', recordingDriver)
  vi.stubGlobal('fetchLastContentCommit', fetchLastContentCommit)
  vi.stubGlobal('normalizeContentDir', normalizeContentDir)
}

// In place before the import: `refs.ts` builds its storage at module load.
stubAutoImports()
const { resolveContentSha } = await import('../../server/utils/content/refs')

/** One `commits` answer, or an error status. */
function stubApi(answer: { sha?: string, status?: number }) {
  return vi.fn(async () => {
    if (answer.status) return new Response('[]', { status: answer.status })
    return new Response(JSON.stringify(answer.sha ? [{ sha: answer.sha }] : []), { status: 200 })
  })
}

describe('resolveContentSha', () => {
  beforeEach(() => {
    // Re-applied every test: `unstubAllGlobals` below clears them.
    stubAutoImports()
    writes.length = 0
    store.clear()
    delete process.env.VERCEL_ENV
  })

  afterEach(() => vi.unstubAllGlobals())

  it('queries once, then serves the pointer from the cache', async () => {
    const fetchMock = stubApi({ sha: SHA('a') })
    vi.stubGlobal('fetch', fetchMock)

    expect(await resolveContentSha('nuxt/nuxt', '4.x', 'docs')).toBe(SHA('a'))
    expect(await resolveContentSha('nuxt/nuxt', '4.x', 'docs')).toBe(SHA('a'))
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('re-queries when the webhook forces a refresh', async () => {
    vi.stubGlobal('fetch', stubApi({ sha: SHA('b') }))
    await resolveContentSha('nuxt/nuxt', 'main', 'docs')

    const refreshed = stubApi({ sha: SHA('c') })
    vi.stubGlobal('fetch', refreshed)

    expect(await resolveContentSha('nuxt/nuxt', 'main', 'docs', { refresh: true })).toBe(SHA('c'))
    expect(refreshed).toHaveBeenCalledOnce()
  })

  it('keys pointers per repo, branch and content directory', async () => {
    vi.stubGlobal('fetch', stubApi({ sha: SHA('d') }))

    await resolveContentSha('nuxt/nuxt', '4.x', 'docs')
    await resolveContentSha('nuxt/cli', '4.x', 'docs')

    expect(writes).toHaveLength(2)
    expect(new Set(writes.map(write => write.key)).size).toBe(2)
  })

  it('holds the production pointer for an hour, because the webhook refreshes it', async () => {
    process.env.VERCEL_ENV = 'production'
    vi.stubGlobal('fetch', stubApi({ sha: SHA('e') }))

    await resolveContentSha('nuxt/nuxt', '4.x', 'docs')

    expect(writes.at(-1)?.ttl).toBe(60 * 60)
  })

  it('expires a preview pointer sooner, because nothing refreshes it', async () => {
    process.env.VERCEL_ENV = 'preview'
    vi.stubGlobal('fetch', stubApi({ sha: SHA('f') }))

    await resolveContentSha('nuxt/nuxt', '4.x', 'docs')

    expect(writes.at(-1)?.ttl).toBe(600)
  })

  it('does not cache a 404, so a rotated token cannot down the site for the TTL', async () => {
    const fetchMock = stubApi({ status: 404 })
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveContentSha('nuxt/nuxt', 'gone', 'docs')).rejects.toMatchObject({ statusCode: 404 })
    expect(writes).toHaveLength(0)

    // The next request retries rather than being served a remembered failure.
    vi.stubGlobal('fetch', stubApi({ sha: SHA('a') }))
    expect(await resolveContentSha('nuxt/nuxt', 'gone', 'docs')).toBe(SHA('a'))
  })

  it('propagates a retryable failure instead of caching it', async () => {
    vi.stubGlobal('fetch', stubApi({ status: 503 }))

    await expect(resolveContentSha('nuxt/nuxt', '4.x', 'docs')).rejects.toThrow(/503/)
    expect(writes).toHaveLength(0)
  })

  it('404s when the directory has no history on that branch', async () => {
    vi.stubGlobal('fetch', stubApi({}))

    await expect(resolveContentSha('nuxt/nuxt', '4.x', 'nope')).rejects.toMatchObject({ statusCode: 404 })
    expect(writes).toHaveLength(0)
  })
})
