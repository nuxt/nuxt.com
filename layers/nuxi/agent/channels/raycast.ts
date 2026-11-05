import { defineChannel, GET, POST } from 'eve/channels'
import type { RouteHandlerArgs } from 'eve/channels'
import type { RaycastAccount } from '../lib/raycast.js'
import {
  raycastCredential, raycastAddress, raycastAuth, raycastCursor,
  raycastEventStream, RaycastHttpError, raycastThreadId, readRaycastHistory, readRaycastMessage
} from '../lib/raycast.js'

// Use the existing Eve mount so Nuxt development and Vercel previews route it too.
const BASE = '/eve/v1/raycast/v1'
const BOT = {
  id: 'nuxi', name: 'Nuxi', description: 'Your Nuxt companion', iconUrl: 'https://nuxt.com/nuxt-agent.jpg',
  capabilities: { attachments: false, screenAwareness: false, events: false }
}

type Args = RouteHandlerArgs<Record<string, never>>
function route(handler: (request: Request, args: Args, address: string, account: RaycastAccount) => Promise<Response>, publicRoute = false) {
  return async (request: Request, args: Args) => {
    try {
      const account = publicRoute ? undefined : await raycastCredential(request)
      const address = account && args.params.threadId ? raycastAddress(account.id, raycastThreadId(args.params.threadId)) : ''
      const response = await handler(request, args, address, account!)
      response.headers.set('cache-control', 'no-store')
      return response
    } catch (error) {
      return Response.json({}, { status: error instanceof RaycastHttpError ? error.status : 503, headers: { 'cache-control': 'no-store' } })
    }
  }
}

export default defineChannel({
  audience: () => 'private',
  turnPolicy: 'queue',
  routes: [
    GET(`${BASE}/status`, route(async request => Response.json({ online: true, bot: BOT, signIn: { start: new URL('/raycast/connect', request.url).href, configured: true } }), true)),
    GET(`${BASE}/me`, route(async (_request, _args, _address, account) => Response.json({ user: { id: account.id, name: account.name, avatarUrl: account.avatarUrl }, token: { expiresAt: account.expiresAt }, bot: BOT }))),
    POST(`${BASE}/threads/:threadId/messages`, route(async (request, { params, from, resolveSession, attachSession }, address, account) => {
      const message = await readRaycastMessage(request)
      const current = await resolveSession(address)
      // A fixed session keeps cursor history intact; upgrades may require a new Raycast chat.
      const delivery = await (current ?? from(address)).send(message, { auth: raycastAuth(account), turnPolicy: 'queue' })
      for await (const event of delivery.stream({ signal: AbortSignal.timeout(15_000) })) {
        if (event.type === 'delivery.admitted' && event.data.deliveryId === delivery.deliveryId) break
      }
      const history = await readRaycastHistory(attachSession(delivery.sessionId), request.signal)
      const started = history.events.find(event => event.turnId === delivery.deliveryId && event.type === 'turn.started')
      if (!started) throw new RaycastHttpError(503)
      return Response.json({ turnId: delivery.deliveryId, threadId: params.threadId, eventId: started.id }, { status: 202 })
    })),
    GET(`${BASE}/threads/:threadId/events`, route(async (request, { resolveSession }, address) => {
      const after = raycastCursor(request)
      const session = await resolveSession(address)
      if (!session) throw new RaycastHttpError(404)
      return raycastEventStream(request, after, async (cursor) => {
        const history = await readRaycastHistory(session, request.signal)
        return { events: history.events.filter(event => event.id > cursor), active: history.active }
      })
    })),
    GET(`${BASE}/threads/:threadId/turns/:turnId`, route(async (request, { params, resolveSession }, address) => {
      const session = await resolveSession(address)
      if (!session) throw new RaycastHttpError(404)
      const history = await readRaycastHistory(session, request.signal)
      const turn = history.turns.get(params.turnId!)
      if (!turn) throw new RaycastHttpError(404)
      return Response.json(turn)
    })),
    POST(`${BASE}/auth/revoke`, route(async (request) => {
      await raycastCredential(request, 'revoke')
      return Response.json({ ok: true })
    })),
    POST(`${BASE}/threads/:threadId/cancel`, route(async (_request, { resolveSession }, address) => {
      const session = await resolveSession(address)
      if (session) await session.cancel()
      return Response.json({ ok: true })
    }))
  ]
})
