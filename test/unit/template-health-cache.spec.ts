import { and, eq } from 'drizzle-orm'
import { createApp, defineEventHandler, setResponseHeader, toWebHandler } from 'h3'
import { createStorage, prefixStorage } from 'unstorage'
import vercelRuntimeCache from 'unstorage/drivers/vercel-runtime-cache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as schema from '../../server/db/schema'
import { emptyCheckRow, type CheckRow } from '../../server/utils/templates/check-report'

const context = vi.hoisted(() => ({ storage: null as unknown, expireTag: vi.fn(), fetchHealth: vi.fn() }))
vi.mock('nitropack/runtime/internal/storage', () => ({ useStorage: () => context.storage }))
vi.mock('nitropack/runtime/internal/app', () => ({ useNitroApp: () => ({ captureError: vi.fn() }) }))
vi.mock('@vercel/functions', () => ({ getCache: () => ({ expireTag: context.expireTag }) }))
vi.mock('workflow/api', () => ({ start: vi.fn() }))
vi.mock('../../server/workflows/check-templates', () => ({ checkTemplatesWorkflow: vi.fn() }))

const { defineCachedFunction } = await import('nitropack/runtime/internal/cache')
const { recordTemplateCheck } = await import('../../server/utils/templates/checks')

const REQUEST_CONTEXT = Symbol.for('@vercel/request-context')
let row: CheckRow
let ownsRow: boolean
let failInvalidation: boolean
let regions: Map<string, { value: unknown, tags: string[] }>[]
let storage: ReturnType<typeof createStorage>

function enterRegion(index: number) {
  const items = regions[index]!
  vi.stubGlobal(REQUEST_CONTEXT, { get: () => ({ cache: {
    get: async (key: string) => items.get(key)?.value ?? null,
    set: async (key: string, value: unknown, options: { tags: string[] }) => { items.set(key, { value, tags: options.tags }) },
    delete: async (key: string) => { items.delete(key) }
  } }) })
}

async function healthResponse(method = 'GET', query = '') {
  vi.stubGlobal('defineCachedFunction', defineCachedFunction)
  vi.stubGlobal('defineEventHandler', defineEventHandler)
  vi.stubGlobal('setResponseHeader', setResponseHeader)
  vi.stubGlobal('fetchTemplateHealth', context.fetchHealth)
  const { default: handler } = await import('../../server/api/templates/health.get')
  const app = createApp().use(handler)
  return toWebHandler(app)(new Request(`http://localhost/api/templates/health${query}`, { method }))
}

async function healthRequest(method = 'GET', query = '') {
  const response = await healthResponse(method, query)
  return method === 'HEAD' ? response.status : (await response.json()).canvas.check.status
}

beforeEach(() => {
  row = { ...emptyCheckRow('canvas'), state: 'running', runId: 'run', status: 'failed', step: 'build', checkedAt: new Date(), startedAt: new Date() }
  ownsRow = true
  failInvalidation = false
  context.fetchHealth.mockReset().mockImplementation(async () => ({ canvas: { check: { status: row.status } } }))
  regions = [new Map(), new Map()]
  storage = createStorage({ driver: vercelRuntimeCache() })
  // Match the dedicated tagged mount, leaving unrelated caches outside its scope.
  storage.mount('cache:nitro:handlers:template-health', vercelRuntimeCache({ base: 'nitro:handlers:template-health', tags: ['template-health'] }))
  context.storage = storage
  context.expireTag.mockReset().mockImplementation(async (tag: string) => {
    if (failInvalidation) throw new Error('Cache unavailable')
    for (const items of regions) {
      for (const [key, item] of items) if (item.tags.includes(tag)) items.delete(key)
    }
  })
  enterRegion(0)
  vi.stubEnv('VERCEL', '1')
  vi.stubGlobal('useStorage', (base: string) => prefixStorage(storage, base))
  vi.stubGlobal('schema', schema)
  vi.stubGlobal('eq', eq)
  vi.stubGlobal('and', and)
  vi.stubGlobal('db', {
    select: () => ({ from: () => ({ where: async () => [row] }) }),
    update: () => ({ set: (patch: Partial<CheckRow>) => ({ where: () => ({ returning: async () => {
      if (!ownsRow) return []
      row = { ...row, ...patch }
      return [{ slug: row.slug }]
    } }) }) })
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('template health cache after a check', () => {
  it('prevents HTTP caching on fresh and cached GET and HEAD responses while retaining the server cache', async () => {
    for (const method of ['GET', 'GET', 'HEAD']) {
      const response = await healthResponse(method)
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBe('no-store')
    }
    expect(context.fetchHealth).toHaveBeenCalledTimes(1)
  })

  it.each(['passed', 'failed'] as const)('serves the new %s result in both regions without listing keys', async (status) => {
    row.status = status === 'passed' ? 'failed' : 'passed'
    const previous = row.status
    for (const region of [0, 1]) {
      enterRegion(region)
      expect(await healthRequest()).toBe(previous)
      expect(await healthRequest('HEAD')).toBe(200)
      await storage.setItem('cache:nitro:functions:template-repo-health:all.json', 'repository metadata')
    }
    expect(await storage.getKeys()).toEqual([])

    enterRegion(0)
    await recordTemplateCheck({ kind: 'finish', slug: 'canvas', runId: 'run', status })
    for (const region of [0, 1]) {
      enterRegion(region)
      expect(await storage.getItem('cache:nitro:handlers:template-health:all:HEAD.json')).toBeNull()
      expect(await healthRequest()).toBe(status)
      expect(await healthRequest('GET', '?ignored=1')).toBe(status)
      expect(await storage.getItem('cache:nitro:functions:template-repo-health:all.json')).toBe('repository metadata')
    }
    expect(context.expireTag).toHaveBeenCalledWith('template-health')
  })

  it('invalidates the local cache outside Vercel without calling its API', async () => {
    vi.stubEnv('VERCEL', '')
    expect(await healthRequest()).toBe('failed')
    await recordTemplateCheck({ kind: 'finish', slug: 'canvas', runId: 'run', status: 'passed' })
    expect(await healthRequest()).toBe('passed')
    expect(context.expireTag).not.toHaveBeenCalled()
  })

  it('does not invalidate for progress, a cancelled check or a report that lost ownership', async () => {
    await recordTemplateCheck({ kind: 'progress', slug: 'canvas', runId: 'run', phase: 'build' })
    ownsRow = false
    await recordTemplateCheck({ kind: 'finish', slug: 'canvas', runId: 'run', status: 'passed' })
    ownsRow = true
    await recordTemplateCheck({ kind: 'finish', slug: 'canvas', runId: 'run' })
    expect(context.expireTag).not.toHaveBeenCalled()
  })

  it('keeps the saved result accepted if invalidation fails', async () => {
    failInvalidation = true
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(recordTemplateCheck({ kind: 'finish', slug: 'canvas', runId: 'run', status: 'passed' })).resolves.toMatchObject({ stopped: false })
    expect(row.status).toBe('passed')
    expect(log).toHaveBeenCalledWith('[templates] health cache clear failed', expect.any(Error))
  })
})
