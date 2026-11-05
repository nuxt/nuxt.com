import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RouteHandlerArgs } from 'eve/channels'
import type { SessionReader } from 'eve/sessions'
import channel from '../../layers/nuxi/agent/channels/raycast'
import { raycastAuth, raycastAddress, raycastEventStream, readRaycastHistory, readRaycastMessage } from '../../layers/nuxi/agent/lib/raycast'
import { resolveContext } from '../../layers/nuxi/agent/lib/identity/context'
import { isAdminMode } from '../../layers/nuxi/agent/lib/identity/admin-mode'

const TOKEN = `nuxi_rc_${'a'.repeat(43)}`
const ACCOUNT = { id: 'user-1', name: 'Nuxt team member', login: 'demo-user', role: 'admin' as const, avatarUrl: '', expiresAt: '2026-12-05T00:00:00Z' }
beforeEach(() => {
  vi.stubEnv('INTERNAL_API_SECRET', 'test-internal-secret')
  vi.stubEnv('VERCEL_URL', 'test-preview.vercel.app')
  vi.stubEnv('NUXT_PUBLIC_SITE_URL', 'https://nuxt.com')
  vi.stubGlobal('fetch', vi.fn(async (_url, init) => {
    const { token, action } = JSON.parse(init.body)
    if (action === 'revoke') return Response.json({ ok: true })
    if (token === TOKEN) return Response.json(ACCOUNT)
    return Response.json({ ...ACCOUNT, id: 'user-2', login: 'another-user' })
  }))
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

type Event = ReturnType<SessionReader['stream']> extends AsyncIterable<infer T> ? T : never
function facts(outcome: 'completed' | 'failed' | 'cancelled' | 'paused' = 'completed'): Event[] {
  const scope = { turnId: 'turn_0', runId: 'run_0' }
  const events = [
    { type: 'delivery.admitted', data: { deliveryId: 'delivery-1', source: { channel: 'channel:raycast' } } },
    { type: 'turn.started', data: { turnId: 'turn_0', follows: null, cause: { deliveryId: 'delivery-1' } }, scope },
    { type: 'delivery.consumed', data: { deliveryId: 'delivery-1', turnId: 'turn_0', parts: [] }, scope },
    { type: 'model.requested', data: { runId: 'run_0', owner: { turnId: 'turn_0' } }, scope },
    { type: 'call.requested', data: { callId: 'call_0', owner: { runId: 'run_0' }, capability: { kind: 'tool', name: 'search_docs' }, input: {} }, scope },
    { type: 'call.started', data: { callId: 'call_0' }, scope },
    { type: 'call.settled', data: { callId: 'call_0', outcome: 'completed', output: {} }, scope },
    { type: 'content.completed', data: { partId: 'reasoning', kind: 'text', phase: 'reasoning', value: 'Private reasoning' }, scope },
    { type: 'content.completed', data: { partId: 'part_0', kind: 'text', phase: 'reply', value: 'Use **useFetch**.' }, scope },
    ...(outcome === 'paused'
      ? [
          { type: 'turn.paused', data: { turnId: 'turn_0', awaiting: [] }, scope },
          { type: 'turn.settled', data: { turnId: 'turn_0', outcome: 'cancelled' }, scope }
        ]
      : [{ type: 'turn.settled', data: { turnId: 'turn_0', outcome, reply: ['part_0'], error: { message: 'Private runtime error' } }, scope }])
  ]
  return events.map((event, line) => ({ ...event, meta: { position: { line, index: 0 }, at: '2026-11-05T12:00:00Z', endOfLine: true } })) as Event[]
}
function reader(events = facts()): SessionReader {
  return { id: 'eve-session', async* stream() {
    yield* events
  } }
}
function harness(events = facts()) {
  const session = { ...reader(events), send: vi.fn(), cancel: vi.fn() }
  const send = vi.fn(async () => ({ sessionId: session.id, deliveryId: 'delivery-1', stream: () => reader(events).stream() }))
  session.send = send
  const from = vi.fn(() => ({ send }))
  const resolveSession = vi.fn(async () => session)
  const attachSession = vi.fn(() => session)
  async function request(path: string, method = 'GET', body?: unknown, authorized = true, token = TOKEN) {
    const route = channel.routes.find(route => route.method === method && route.path === `/eve/v1/raycast/v1${path}`)
    if (!route || route.transport === 'websocket') throw new Error('Missing route')
    const req = new Request(`http://localhost/eve/v1/raycast/v1${path.replace(':threadId', 'rc-chat').replace(':turnId', 'delivery-1')}`, {
      method,
      headers: { ...(authorized ? { authorization: `Bearer ${token}` } : {}), ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined
    })
    return route.handler(req, { params: { threadId: 'rc-chat', turnId: 'delivery-1' }, from, resolveSession, attachSession } as unknown as RouteHandlerArgs<never>)
  }
  return { request, send, from, session, resolveSession }
}

describe('Raycast HTTP channel', () => {
  it('discovers the browser sign-in flow and verifies the personal credential', async () => {
    const h = harness()
    const status = await h.request('/status', 'GET', undefined, false)
    expect(status.status).toBe(200)
    expect(await status.json()).toMatchObject({ online: true, bot: { name: 'Nuxi', iconUrl: 'http://localhost/nuxi.png' }, signIn: { start: 'http://localhost/raycast/connect', configured: true } })
    const me = await h.request('/me')
    expect(await me.json()).toMatchObject({ user: { id: ACCOUNT.id }, bot: { iconUrl: 'http://localhost/nuxi.png', capabilities: { attachments: false, screenAwareness: false, events: false } } })
    expect(me.headers.get('cache-control')).toBe('no-store')
    expect(fetch).toHaveBeenCalledWith('https://test-preview.vercel.app/api/internal/raycast-auth', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer test-internal-secret' }), body: JSON.stringify({ action: 'authenticate', token: TOKEN })
    }))
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({}, { status: 401 }))
    expect((await h.request('/me')).status).toBe(401)
    expect((await h.request('/me', 'GET', undefined, true, 'old-shared-mcp-token')).status).toBe(401)
  })

  it('protects every conversation route before accessing Eve', async () => {
    const h = harness()
    for (const [path, method] of [
      ['/me', 'GET'], ['/auth/revoke', 'POST'], ['/threads/:threadId/messages', 'POST'], ['/threads/:threadId/events', 'GET'],
      ['/threads/:threadId/turns/:turnId', 'GET'], ['/threads/:threadId/cancel', 'POST']
    ]) expect((await h.request(path!, method, undefined, false)).status).toBe(401)
    expect(h.send).not.toHaveBeenCalled()
    expect(h.resolveSession).not.toHaveBeenCalled()
  })

  it('accepts context, continues the same Eve session and returns replayable replies', async () => {
    const h = harness()
    const response = await h.request('/threads/:threadId/messages', 'POST', {
      text: 'How does useFetch work?', context: [{ type: 'text', source: 'selection', name: 'Selection', text: 'const data = useFetch(...)' }]
    })
    expect(response.status).toBe(202)
    expect(await response.json()).toEqual({ turnId: 'delivery-1', threadId: 'rc-chat', eventId: 1 })
    expect(h.resolveSession).toHaveBeenCalledWith(raycastAddress(ACCOUNT.id, 'rc-chat'))
    expect(h.send).toHaveBeenCalledWith([
      { type: 'text', text: 'Selection (selection):\nconst data = useFetch(...)' }, { type: 'text', text: 'How does useFetch work?' }
    ], expect.objectContaining({ auth: raycastAuth(ACCOUNT), turnPolicy: 'queue' }))
    const stream = await h.request('/threads/:threadId/events')
    expect(stream.headers.get('content-type')).toBe('text/event-stream')
    expect(await stream.text()).toContain('"type":"message.completed"')
    expect(await (await h.request('/threads/:threadId/turns/:turnId')).json()).toEqual({ state: 'completed', text: 'Use **useFetch**.' })
  })

  it('isolates the same thread ID between accounts and revokes personal credentials', async () => {
    const h = harness()
    await h.request('/threads/:threadId/cancel', 'POST')
    await h.request('/threads/:threadId/cancel', 'POST', undefined, true, `nuxi_rc_${'b'.repeat(43)}`)
    expect(h.resolveSession.mock.calls).toEqual([[raycastAddress(ACCOUNT.id, 'rc-chat')], [raycastAddress('user-2', 'rc-chat')]])
    const response = await h.request('/auth/revoke', 'POST')
    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ body: JSON.stringify({ action: 'revoke', token: TOKEN }) }))
  })

  it('cancels the existing conversation', async () => {
    const h = harness()
    expect(await (await h.request('/threads/:threadId/cancel', 'POST')).json()).toEqual({ ok: true })
    expect(h.session.cancel).toHaveBeenCalledOnce()
  })

  it('rejects files, screen captures, empty messages and oversized inputs before dispatch', async () => {
    const h = harness()
    for (const body of [{ text: '' }, { text: 'Hi', attachments: [{ fileId: 'abc' }] }, { text: 'Hi', context: [{ type: 'screen', text: 'Private screen' }] }]) {
      expect((await h.request('/threads/:threadId/messages', 'POST', body)).status).toBe(400)
    }
    expect((await h.request('/threads/:threadId/messages', 'POST', { text: 'a'.repeat(70_000) })).status).toBe(413)
    expect(h.send).not.toHaveBeenCalled()
  })

  it('grants admin tools to the verified GitHub admin identity on each delivery', async () => {
    expect(resolveContext(raycastAuth(ACCOUNT))).toMatchObject({ surface: 'raycast', person: { id: ACCOUNT.id } })
    const h = harness()
    await h.request('/threads/:threadId/messages', 'POST', { text: 'Is the Canvas template building?' })
    const auth = raycastAuth(ACCOUNT)
    expect(h.send).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ auth }))
    expect(auth.attributes).toMatchObject({ role: 'admin', login: ACCOUNT.login })
    expect(await isAdminMode(auth)).toBe(true)
  })
})

describe('Eve history translation', () => {
  it('replays stable cursors, tool activity and only the final reply', async () => {
    const history = await readRaycastHistory(reader())
    expect(history.events.map(event => event.type)).toEqual(['turn.started', 'tool.started', 'tool.finished', 'message.completed'])
    expect(history.events.map(event => event.id)).toEqual([1, 2, 3, 4])
    expect(history.events.at(-1)?.data.text).toBe('Use **useFetch**.')
    expect(history.active).toBe(false)
    expect(JSON.stringify(history.events)).not.toMatch(/Private/)
    expect((await readRaycastHistory(reader())).events).toEqual(history.events)
  })

  it.each(['failed', 'cancelled', 'paused'] as const)('emits exactly one terminal event for %s turns', async (outcome) => {
    const history = await readRaycastHistory(reader(facts(outcome)))
    const terminals = history.events.filter(event => ['message.completed', 'turn.failed', 'turn.cancelled'].includes(event.type))
    expect(terminals).toHaveLength(1)
    expect(terminals[0]?.type).toBe(outcome === 'cancelled' ? 'turn.cancelled' : 'turn.failed')
    expect(JSON.stringify(history.events)).not.toMatch(/Private/)
    expect(history.active).toBe(false)
  })

  it('keeps cursors increasing across several turns, ignoring control deliveries', async () => {
    const first = facts()
    const second = JSON.parse(JSON.stringify(facts()).replaceAll('delivery-1', 'delivery-2').replaceAll('turn_0', 'turn_1').replaceAll('run_0', 'run_1').replaceAll('call_0', 'call_1').replaceAll('part_0', 'part_1')) as Event[]
    for (const [index, event] of second.entries()) Object.assign(event.meta, { position: { line: first.length + 1 + index, index: 0 } })
    const control = { type: 'delivery.admitted', data: { deliveryId: 'cancel', source: { control: 'cancel' } }, meta: { ...first[0]!.meta, position: { line: first.length, index: 0 } } } as Event
    const history = await readRaycastHistory(reader([...first, control, ...second]))
    expect(history.events.map(event => event.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(history.turns.size).toBe(2)
  })
})

describe('Raycast readers', () => {
  it('replays after the cursor and reads newly completed work', async () => {
    const event = { id: 8, turnId: 't', type: 'message.completed' as const, data: { text: 'Done' } }
    const read = vi.fn().mockResolvedValueOnce({ events: [], active: true }).mockResolvedValueOnce({ events: [event], active: false })
    const response = raycastEventStream(new Request('http://localhost'), 7, read, { pollMs: 1, leaseMs: 1000 })
    expect(await response.text()).toContain('"id":8')
    expect(read.mock.calls.map(call => call[0])).toEqual([7, 7])
  })

  it('stops reading on disconnect without cancelling generation', async () => {
    const read = vi.fn(async () => ({ events: [], active: true }))
    const response = raycastEventStream(new Request('http://localhost'), 0, read, { pollMs: 1000, leaseMs: 25_000 })
    const stream = response.body!.getReader()
    await stream.read()
    await stream.cancel()
    expect(read).toHaveBeenCalledOnce()
  })

  it('limits streamed input even without Content-Length', async () => {
    const request = new Request('http://localhost', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'x'.repeat(70_000) }) })
    await expect(readRaycastMessage(request)).rejects.toMatchObject({ status: 413 })
  })
})
