import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { appFetch, selfAccessHeaders } from '../../layers/nuxi/agent/lib/internal-api'

const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response('ok'))

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  fetchMock.mockClear()
  for (const name of ['NUXT_PUBLIC_SITE_URL', 'NUXT_SITE_URL', 'VERCEL_URL', 'VERCEL_OIDC_TOKEN']) vi.stubEnv(name, '')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function sentHeaders() {
  return fetchMock.mock.calls[0]![1]!.headers as Record<string, string>
}

describe('appFetch', () => {
  it('sends the project OIDC token to its own deployment URL', async () => {
    vi.stubEnv('VERCEL_URL', 'nuxt-abc123-nuxt-js.vercel.app')
    vi.stubEnv('VERCEL_OIDC_TOKEN', 'project-token')

    await appFetch('/raw/docs/4.x/getting-started/introduction.md', { headers: { authorization: 'Bearer secret' } })

    expect(fetchMock.mock.calls[0]![0]).toBe('https://nuxt-abc123-nuxt-js.vercel.app/raw/docs/4.x/getting-started/introduction.md')
    expect(sentHeaders()).toEqual({ 'x-vercel-trusted-oidc-idp-token': 'project-token', 'authorization': 'Bearer secret' })
  })

  it('keeps the token away from a configured site URL', async () => {
    vi.stubEnv('NUXT_PUBLIC_SITE_URL', 'https://nuxt.com/')
    vi.stubEnv('VERCEL_URL', 'nuxt-abc123-nuxt-js.vercel.app')
    vi.stubEnv('VERCEL_OIDC_TOKEN', 'project-token')

    await appFetch('/llms.txt')

    expect(fetchMock.mock.calls[0]![0]).toBe('https://nuxt.com/llms.txt')
    expect(sentHeaders()).toEqual({})
  })

  it('still calls the deployment when no token is available', async () => {
    vi.stubEnv('VERCEL_URL', 'nuxt-abc123-nuxt-js.vercel.app')

    await appFetch('/llms.txt')

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(sentHeaders()).toEqual({})
  })

  it('sends nothing outside Vercel', () => {
    vi.stubEnv('VERCEL_OIDC_TOKEN', 'project-token')
    expect(selfAccessHeaders()).toEqual({})
  })
})
