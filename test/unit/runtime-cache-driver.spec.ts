import { createStorage } from 'unstorage'
import vercelRuntimeCache from 'unstorage/drivers/vercel-runtime-cache'
import { afterEach, describe, expect, it, vi } from 'vitest'

/** Where Vercel's runtime exposes the current request's context, its cache client included. */
const REQUEST_CONTEXT = Symbol.for('@vercel/request-context')

/** One request's cache client. */
function requestClient() {
  const items = new Map<string, unknown>()
  return {
    get: vi.fn(async (key: string) => items.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown) => void items.set(key, value)),
    delete: vi.fn(async (key: string) => void items.delete(key)),
    expireTag: vi.fn(async () => {})
  }
}

/** Runs the next cache calls as if inside the request that owns `client`. */
function inRequest(client: ReturnType<typeof requestClient>) {
  vi.stubGlobal(REQUEST_CONTEXT, { get: () => ({ cache: client }) })
}

// Guards `patches/unstorage@1.17.5.patch`: the stock driver keeps the first request's client for the instance's life.
describe('vercel-runtime-cache driver', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('uses the current request\'s cache client, not the first one it saw', async () => {
    const storage = createStorage({ driver: vercelRuntimeCache({ base: 'refs' }) })

    const first = requestClient()
    inRequest(first)
    await storage.setItem('key', 'sha')

    // A later request on the same instance, after the first request's JWT has expired.
    const later = requestClient()
    inRequest(later)
    await storage.getItem('key')
    await storage.setItem('key', 'sha')
    await storage.removeItem('key')

    expect(first.get).not.toHaveBeenCalled()
    expect(first.set).toHaveBeenCalledOnce()
    expect(later.get).toHaveBeenCalledWith('refs:key')
    expect(later.set).toHaveBeenCalledWith('refs:key', 'sha', expect.anything())
    expect(later.delete).toHaveBeenCalledWith('refs:key')
  })
})
