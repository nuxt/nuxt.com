import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { kv } from '../stubs/hub-kv'
import { raycastReturnTo } from '../../shared/utils/raycast'
import { issueRaycastCredential, readRaycastCredential, revokeRaycastCredential } from '../../layers/nuxi/server/utils/raycast-auth'

vi.mock('nuxt/server', async () => {
  const h3 = await import('h3')
  return {
    createError: h3.createError,
    defineEventHandler: (handler: unknown) => handler,
    getRequestHeader: (event: TestEvent, name: string) => event.headers[name],
    getRequestURL: (event: TestEvent) => new URL(event.url),
    readValidatedBody: async (event: TestEvent, validate: (value: unknown) => unknown) => validate(event.body)
  }
})
import connectHandler from '../../server/api/auth/raycast.post'
import accountHandler from '../../layers/nuxi/server/api/internal/raycast-auth.post'

const CALLBACK = 'http://127.0.0.1:54321/external-agents/sign-in/random-listener'
const USER = { id: 'user-1', name: 'Team member', username: 'demo-user', avatar: '', provider: 'github', role: 'admin' }
interface TestEvent {
  url: string
  headers: Record<string, string>
  body: Record<string, unknown>
  res: { headers: Headers }
}
const connect = connectHandler as unknown as (event: TestEvent) => Promise<{ redirectTo: string }>
const account = accountHandler as unknown as (event: TestEvent) => Promise<Record<string, unknown>>
function event(body: Record<string, unknown> = { returnTo: CALLBACK }): TestEvent {
  return { url: 'https://preview.example/api/auth/raycast', headers: { 'origin': 'https://preview.example', 'sec-fetch-site': 'same-origin' }, body, res: { headers: new Headers() } }
}
const authorized = vi.fn(async () => true)
const findUser = vi.fn(async () => USER as typeof USER | undefined)

beforeEach(async () => {
  await kv.clear()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-05T12:00:00Z'))
  vi.stubEnv('VERCEL_ENV', 'development')
  authorized.mockResolvedValue(true)
  findUser.mockResolvedValue(USER)
  vi.stubGlobal('requireUserSession', vi.fn(async () => ({ user: USER })))
  vi.stubGlobal('isAuthorizedAdmin', authorized)
  vi.stubGlobal('toH3Event', (value: unknown) => value)
  vi.stubGlobal('requireInternalRequest', vi.fn())
  vi.stubGlobal('db', { query: { users: { findFirst: findUser } } })
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('Raycast browser return address', () => {
  it('accepts only explicit loopback listener addresses', () => {
    expect(raycastReturnTo(CALLBACK)).toBe(CALLBACK)
    expect(raycastReturnTo(CALLBACK.replace('127.0.0.1', 'localhost'))).toContain('localhost:54321')
    expect(raycastReturnTo(CALLBACK.replace('54321', '80'))).toBe(CALLBACK.replace('54321', '80'))
  })
  it.each([
    'https://evil.example/external-agents/sign-in/random',
    'http://127.0.0.1.evil.example:54321/external-agents/sign-in/random',
    'http://127.1:54321/external-agents/sign-in/random',
    'http://user@localhost:54321/external-agents/sign-in/random',
    'http://localhost:65536/external-agents/sign-in/random',
    'http://localhost:0/external-agents/sign-in/random',
    'http://localhost:54321/another/path',
    `${CALLBACK}?next=https://evil.example`, `${CALLBACK}#token=bad`, ['http://localhost'], undefined
  ])('rejects unsafe or unexpected callbacks: %s', (value) => {
    expect(raycastReturnTo(value)).toBeUndefined()
  })
})

describe('personal Raycast credentials', () => {
  it('stores only a hash, user ID and expiry, and revokes only the presented connection', async () => {
    const first = await issueRaycastCredential(kv, USER.id)
    const second = await issueRaycastCredential(kv, 'user-2')
    const keys = await kv.keys()
    expect(keys).toHaveLength(2)
    expect(JSON.stringify(keys)).not.toContain(first.token)
    expect(await readRaycastCredential(kv, first.token)).toEqual({ userId: USER.id, expiresAt: first.expiresAt })
    await revokeRaycastCredential(kv, first.token)
    expect(await readRaycastCredential(kv, first.token)).toBeUndefined()
    expect((await readRaycastCredential(kv, second.token))?.userId).toBe('user-2')
    expect(await readRaycastCredential(kv, 'old-shared-mcp-token')).toBeUndefined()
  })

  it('expires after 30 days and isolates preview branches from production', async () => {
    const credential = await issueRaycastCredential(kv, USER.id)
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(await readRaycastCredential(kv, credential.token)).toBeUndefined()
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'feature/a')
    const preview = await issueRaycastCredential(kv, USER.id)
    vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'feature/b')
    expect(await readRaycastCredential(kv, preview.token)).toBeUndefined()
    vi.stubEnv('VERCEL_ENV', 'development')
    vi.advanceTimersByTime(30 * 24 * 60 * 60 * 1000)
    expect(await readRaycastCredential(kv, credential.token)).toBeUndefined()
  })
})

describe('connect with the website GitHub session', () => {
  it('hands the credential to Raycast in the fragment without exposing the browser session', async () => {
    const request = event()
    const result = await connect(request)
    const callback = new URL(result.redirectTo)
    expect(callback.origin + callback.pathname).toBe(CALLBACK)
    expect(callback.search).toBe('')
    const parameters = new URLSearchParams(callback.hash.slice(1))
    expect(parameters.get('expires_in')).toBe('2592000')
    expect((await readRaycastCredential(kv, parameters.get('token')!))?.userId).toBe(USER.id)
    expect(authorized).toHaveBeenCalledWith(request, USER.username)
    expect(Object.fromEntries(request.res.headers)).toMatchObject({ 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' })
  })

  it('rejects cross-origin connections, missing sessions, invalid callbacks and non-team users before minting', async () => {
    const request = event()
    request.headers.origin = 'https://evil.example'
    await expect(connect(request)).rejects.toMatchObject({ statusCode: 403 })
    const missingOrigin = event()
    delete missingOrigin.headers.origin
    await expect(connect(missingOrigin)).rejects.toMatchObject({ statusCode: 403 })
    const sibling = event()
    sibling.headers['sec-fetch-site'] = 'same-site'
    await expect(connect(sibling)).rejects.toMatchObject({ statusCode: 403 })
    await expect(connect(event({ returnTo: 'https://evil.example' }))).rejects.toMatchObject({ statusCode: 400 })
    vi.stubGlobal('requireUserSession', vi.fn(async () => {
      throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
    }))
    await expect(connect(event())).rejects.toMatchObject({ statusCode: 401 })
    vi.stubGlobal('requireUserSession', vi.fn(async () => ({ user: USER })))
    authorized.mockResolvedValue(false)
    await expect(connect(event())).rejects.toMatchObject({ statusCode: 403 })
    expect(await kv.keys()).toHaveLength(0)
  })
})

describe('agent credential verification', () => {
  it('resolves the current account, revokes connections and rejects deleted or expired credentials', async () => {
    const { token } = await issueRaycastCredential(kv, USER.id)
    expect(await account(event({ action: 'authenticate', token }))).toMatchObject({ id: USER.id, login: USER.username })
    findUser.mockResolvedValueOnce({ ...USER, role: 'user' })
    await expect(account(event({ action: 'authenticate', token }))).rejects.toMatchObject({ statusCode: 403 })
    findUser.mockResolvedValueOnce(undefined)
    await expect(account(event({ action: 'authenticate', token }))).rejects.toMatchObject({ statusCode: 403 })
    authorized.mockResolvedValueOnce(false)
    await expect(account(event({ action: 'authenticate', token }))).rejects.toMatchObject({ statusCode: 403 })
    await account(event({ action: 'revoke', token }))
    await expect(account(event({ action: 'authenticate', token }))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('requires the internal service credential before reading or revoking anything', async () => {
    vi.stubGlobal('requireInternalRequest', vi.fn(() => {
      throw Object.assign(new Error('Unauthorized'), { statusCode: 401 })
    }))
    await expect(account(event({ action: 'revoke', token: 'bad' }))).rejects.toMatchObject({ statusCode: 401 })
  })
})
