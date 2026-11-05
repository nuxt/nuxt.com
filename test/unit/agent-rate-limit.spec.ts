import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import hook from '../../layers/nuxi/agent/hooks/rate-limit'
import { ANONYMOUS_IP_DAILY_LIMIT, anonymousIpKey, clientIp } from '../../layers/nuxi/shared/utils/rate-limit'

type TurnStarted = (event: unknown, ctx: unknown) => Promise<void>
const turnStarted = (hook as unknown as { events: { 'turn.started': TurnStarted } }).events['turn.started']

const webAuth = { issuer: 'nuxt.com', principalId: 'anon-1', principalType: 'anonymous', attributes: {} }
const slackAuth = { issuer: 'slack:T1', principalId: 'slack:T1:U1', attributes: { user_id: 'U1', author_type: 'user' } }

function context(auth: unknown, parent?: unknown) {
  return { session: { auth: { current: auth }, parent }, channel: {}, cancel: vi.fn() }
}

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubEnv('INTERNAL_API_SECRET', 'secret')
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('rate-limit hook', () => {
  it('meters web turns without a continuation token', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
    const ctx = context(webAuth)
    await turnStarted({}, ctx)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({ userId: 'anon-1' })
    expect(ctx.cancel).not.toHaveBeenCalled()
  })

  it('cancels the turn once the daily limit is reached', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 429 }))
    const ctx = context(webAuth)
    await turnStarted({}, ctx)
    expect(ctx.cancel).toHaveBeenCalledOnce()
  })

  it('also meters anonymous turns per IP', async () => {
    const ipKey = await anonymousIpKey('203.0.113.7')
    fetchMock
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 429 }))
    const ctx = context({ ...webAuth, attributes: { ip_key: ipKey } })
    await turnStarted({}, ctx)
    expect(JSON.parse(fetchMock.mock.calls[1]![1].body)).toEqual({ userId: ipKey, defaultLimit: ANONYMOUS_IP_DAILY_LIMIT })
    expect(ctx.cancel).toHaveBeenCalledOnce()
  })

  it('does not meter signed-in users per IP', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
    await turnStarted({}, context({ ...webAuth, principalType: 'user', attributes: { ip_key: 'anon-ip:x' } }))
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('skips Slack turns and subagent turns', async () => {
    await turnStarted({}, context(slackAuth))
    await turnStarted({}, context(webAuth, { sessionId: 'parent' }))
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('anonymous IP key', () => {
  it('reads the client IP from proxy headers', () => {
    const headers = new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' })
    expect(clientIp(name => headers.get(name))).toBe('203.0.113.7')
    headers.set('x-real-ip', '198.51.100.2')
    expect(clientIp(name => headers.get(name))).toBe('198.51.100.2')
  })

  it('is stable per IP and does not contain it', async () => {
    const key = await anonymousIpKey('203.0.113.7')
    expect(key).toMatch(/^anon-ip:[0-9a-f]{32}$/)
    expect(await anonymousIpKey('203.0.113.7')).toBe(key)
    expect(await anonymousIpKey('203.0.113.8')).not.toBe(key)
  })
})
