import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContentInstanceKey } from '../../shared/utils/content'

const SHA_A = 'a'.repeat(40)
const SHA_B = 'b'.repeat(40)

/**
 * One fake per `withRef(sha)`, whose `init()` throws once disposed — comark-content@0.4's own
 * behaviour, and the reason a superseded instance must stay usable.
 */
const { createFake } = vi.hoisted(() => ({
  createFake: (ref: string) => {
    const fake = {
      ref,
      disposed: false,
      init: vi.fn(async () => {
        if (fake.disposed) throw new Error('comarkContent: "docs" has been disposed.')
      }),
      dispose: vi.fn(async () => {
        fake.disposed = true
      })
    }
    return fake
  }
}))

vi.mock('../../utils/factory', () => ({
  createInstanceSource: () => ({}),
  createRuntimeInstance: () => ({ withRef: (sha: string) => createFake(sha) })
}))

/** `index.ts` reaches for these through Nitro's auto-imports. */
const resolveInstanceSha = vi.fn(async () => SHA_A)
vi.stubGlobal('resolveInstanceSha', resolveInstanceSha)
vi.stubGlobal('instanceSource', () => ({ name: 'docs', source: { repo: 'nuxt/nuxt', branch: '3.x', contentDir: 'docs', prefix: '/docs/3.x' } }))
vi.stubGlobal('contentGithubToken', () => undefined)
vi.stubGlobal('contentCacheDriver', () => undefined)
vi.stubGlobal('recordDuration', () => 0)

const { getInstanceAtHead } = await import('../../server/utils/content/index')

type Fake = ReturnType<typeof createFake>

/** The keys used below ship no build snapshot, so the mocked source is used as it is. */
const headInstance = async (key: ContentInstanceKey): Promise<Fake> =>
  await getInstanceAtHead(key) as unknown as Fake

describe('getInstanceAtHead', () => {
  beforeEach(() => {
    resolveInstanceSha.mockResolvedValue(SHA_A)
  })

  it('reuses the pinned instance while the ref is unchanged', async () => {
    const first = await headInstance('docs:3.x')
    const second = await headInstance('docs:3.x')

    expect(second).toBe(first)
    expect(first.init).toHaveBeenCalledTimes(1)
  })

  it('leaves the superseded instance usable for requests already holding it', async () => {
    // A request resolves the instance, then a revalidate moves the pointer under it.
    const inFlight = await headInstance('docs:5.x')
    resolveInstanceSha.mockResolvedValue(SHA_B)

    const next = await headInstance('docs:5.x')

    expect(next).not.toBe(inFlight)
    expect(inFlight.dispose).not.toHaveBeenCalled()
    await expect(inFlight.init()).resolves.toBeUndefined()
  })
})
