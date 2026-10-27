import { describe, expect, it, vi } from 'vitest'

/**
 * The search worker keeps one hub at a time in module state, and `nuxt-workers` does not serialize
 * calls — every `warmupSearch` message runs concurrently against that state.
 * So a version switch mid-hydration puts two hydrations in flight, racing to publish themselves.
 */
const { state, makeDeferred } = vi.hoisted(() => {
  interface Deferred { promise: Promise<void>, resolve: () => void, reject: (error: Error) => void }

  const makeDeferred = (): Deferred => {
    let resolve!: () => void
    let reject!: (error: Error) => void
    const promise = new Promise<void>((res, rej) => {
      resolve = () => res()
      reject = rej
    })
    return { promise, resolve, reject }
  }

  return {
    makeDeferred,
    state: {
      instances: [] as Array<{ name: string, ready: Deferred }>,
      hubs: [] as Array<{ names: string[], indexing: Deferred, dispose: ReturnType<typeof vi.fn>, search: ReturnType<typeof vi.fn> }>
    }
  }
})

vi.mock('comark-content/runtime', () => ({
  readArtifact: vi.fn(),
  // Hydration is held open per instance, so a switch can land while inits are still pending.
  comarkContent: (name: string) => {
    const ready = makeDeferred()
    const instance = { name, ready, init: vi.fn(() => ready.promise) }
    state.instances.push(instance)
    return instance
  },
  // `search('')` is the index build — held open so a switch can land during it too.
  contentHub: (instances: Array<{ name: string }>) => {
    const names = instances.map(instance => instance.name)
    const indexing = makeDeferred()
    const hub = {
      names,
      indexing,
      dispose: vi.fn(async () => {}),
      search: vi.fn(async (query: string) => {
        if (query === '') {
          await indexing.promise
          return []
        }
        return [{ from: names.join('+') }]
      })
    }
    state.hubs.push(hub)
    return hub
  }
}))

vi.mock('comark-content/database/sqlite-wasm', () => ({ default: () => ({}) }))
vi.mock('comark-content/sources/snapshot', () => ({ default: () => ({}) }))
vi.mock('comark-content/plugins/sqlite-full-text-search', () => ({ default: () => ({}) }))
vi.mock('ofetch', () => ({ ofetch: vi.fn() }))

vi.mock('../../app/workers/internal/search-logger', () => ({
  setDebug: vi.fn(),
  isDebug: () => false,
  log: vi.fn(),
  since: () => '0ms',
  logger: false,
  describeArtifact: vi.fn(),
  indexedRows: vi.fn(async () => 0)
}))

const ORIGIN = 'https://nuxt.com'
/** Distinct names per version, so a hub says which set built it — the real targets share "docs". */
const FOUR = { name: 'docs4', base: '/api/content/blob/aaa/docs/4.x' }
const THREE = { name: 'docs3', base: '/api/content/blob/bbb/docs/3.x' }

const flush = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0))
const instance = (name: string) => state.instances.find(item => item.name === name)!
const hub = (name: string) => state.hubs.find(item => item.names.includes(name))!

/** Fresh module state per test: `active` and `hydration` live for the worker's lifetime. */
async function loadWorker() {
  vi.resetModules()
  state.instances.length = 0
  state.hubs.length = 0
  return await import('../../app/workers/search')
}

describe('search worker hydration races', () => {
  it('serves the set the user switched to when the older hydration finishes last', async () => {
    const worker = await loadWorker()

    // 4.x gets as far as building its index before the switch.
    const four = worker.warmupSearch([FOUR], ORIGIN, false)
    await flush()
    instance('docs4').ready.resolve()
    await flush()

    const three = worker.warmupSearch([THREE], ORIGIN, false)
    await flush()
    instance('docs3').ready.resolve()
    await flush()

    // 3.x wins the race.
    hub('docs3').indexing.resolve()
    await three

    // 4.x lands after it, and must not take over.
    hub('docs4').indexing.resolve()
    await four

    await expect(worker.searchContent('nuxt')).resolves.toEqual([{ from: 'docs3' }])
    expect(hub('docs4').search).toHaveBeenCalledWith('')
    expect(hub('docs4').dispose).toHaveBeenCalledTimes(1)
    expect(hub('docs3').dispose).not.toHaveBeenCalled()
  })

  it('skips the index build for a set superseded while its instances hydrate', async () => {
    const worker = await loadWorker()

    const four = worker.warmupSearch([FOUR], ORIGIN, false)
    await flush()
    const three = worker.warmupSearch([THREE], ORIGIN, false)
    await flush()

    instance('docs3').ready.resolve()
    await flush()
    hub('docs3').indexing.resolve()
    await three

    // 4.x only finishes hydrating now, with the race already lost.
    instance('docs4').ready.resolve()
    await four

    expect(hub('docs4').search).not.toHaveBeenCalled()
    expect(hub('docs4').dispose).toHaveBeenCalledTimes(1)
    await expect(worker.searchContent('nuxt')).resolves.toEqual([{ from: 'docs3' }])
  })

  it('reuses the live hydration after a superseded one fails', async () => {
    const worker = await loadWorker()

    const four = worker.warmupSearch([FOUR], ORIGIN, false)
    await flush()
    const three = worker.warmupSearch([THREE], ORIGIN, false)
    await flush()

    // A stale pin sinks 4.x after 3.x replaced it.
    instance('docs4').ready.reject(new Error('stale pin'))
    await expect(four).rejects.toThrow(/failed to hydrate/)

    // The 3.x guard has to survive, or this warmup starts a duplicate hydration.
    const again = worker.warmupSearch([THREE], ORIGIN, false)
    expect(state.instances.filter(item => item.name === 'docs3')).toHaveLength(1)

    instance('docs3').ready.resolve()
    await flush()
    hub('docs3').indexing.resolve()
    await Promise.all([three, again])

    expect(state.hubs).toHaveLength(1)
    await expect(worker.searchContent('nuxt')).resolves.toEqual([{ from: 'docs3' }])
  })
})
