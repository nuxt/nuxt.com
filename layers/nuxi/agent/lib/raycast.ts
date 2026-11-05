import { setTimeout } from 'node:timers/promises'
import { z } from 'zod'
import { call, emptySessionView, foldEvents, reply } from 'eve/events'
import type { SessionReader } from 'eve/sessions'
import type { AuthContext } from './identity/context.js'
import { appOrigin, internalHeaders } from './internal-api.js'

export class RaycastHttpError extends Error {
  constructor(readonly status: number) {
    super(`Raycast request failed (${status})`)
  }
}

export interface RaycastAccount {
  id: string
  name: string
  login: string
  avatarUrl: string
  expiresAt: string
}

export function raycastAuth(account: RaycastAccount) {
  return {
    issuer: 'raycast', authenticator: 'github', principalType: 'user', principalId: account.id,
    attributes: { name: account.name, login: account.login }
  } satisfies AuthContext
}

export function raycastAddress(userId: string, threadId: string) {
  return JSON.stringify([userId, threadId])
}

export async function raycastCredential(request: Request, action = 'authenticate'): Promise<RaycastAccount> {
  const authorization = request.headers.get('authorization') ?? ''
  if (!/^Bearer nuxi_rc_[\w-]{43}$/.test(authorization)) throw new RaycastHttpError(401)
  // Verify against this deployment's web service, including on branch previews.
  const origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : appOrigin()
  const response = await fetch(`${origin}/api/internal/raycast-auth`, {
    method: 'POST', headers: internalHeaders(),
    body: JSON.stringify({ action, token: authorization.slice(7) }), signal: AbortSignal.timeout(10_000)
  })
  if (!response.ok) throw new RaycastHttpError(response.status === 401 || response.status === 403 ? response.status : 503)
  return response.json() as Promise<RaycastAccount>
}

const MAX_MESSAGE_BYTES = 64 * 1024
const messageSchema = z.object({
  text: z.string().trim().min(1).max(32_000),
  attachments: z.array(z.never()).optional(),
  context: z.array(z.object({
    type: z.literal('text'),
    source: z.enum(['quote', 'selection', 'clipboard', 'note', 'calendar', 'browser-tab', 'process']).optional(),
    name: z.string().max(200).optional(),
    url: z.string().max(2000).optional(),
    text: z.string().max(16_000)
  })).max(10).optional()
})

export async function readRaycastMessage(request: Request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new RaycastHttpError(415)
  if (Number(request.headers.get('content-length')) > MAX_MESSAGE_BYTES) throw new RaycastHttpError(413)
  const reader = request.body?.getReader()
  if (!reader) throw new RaycastHttpError(400)
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    for (;;) {
      const chunk = await reader.read()
      if (chunk.done) break
      size += chunk.value.byteLength
      if (size > MAX_MESSAGE_BYTES) {
        await reader.cancel()
        throw new RaycastHttpError(413)
      }
      chunks.push(chunk.value)
    }
  } finally {
    reader.releaseLock()
  }
  let decoded: unknown
  try {
    decoded = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new RaycastHttpError(400)
  }
  const result = messageSchema.safeParse(decoded)
  if (!result.success) throw new RaycastHttpError(result.error.issues.some(issue => issue.code === 'too_big') ? 413 : 400)
  // Context stays user input, never agent instructions.
  return [
    ...(result.data.context ?? []).map(item => ({
      type: 'text' as const,
      text: `${item.name ?? 'Attached context'}${item.source ? ` (${item.source})` : ''}:${item.url ? `\nSource: ${item.url}` : ''}\n${item.text}`
    })),
    { type: 'text' as const, text: result.data.text }
  ]
}

export function raycastThreadId(value: string | undefined) {
  if (!value || !/^[\w.:-]{1,128}$/.test(value)) throw new RaycastHttpError(400)
  return value
}

export function raycastCursor(request: Request) {
  const value = new URL(request.url).searchParams.get('after') ?? '0'
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) throw new RaycastHttpError(400)
  return Number(value)
}

/** Reading or disconnecting never cancels the durable Eve turn. */
export function raycastEventStream(
  request: Request,
  after: number,
  read: (after: number) => Promise<{ events: RaycastEvent[], active: boolean }>,
  options = { pollMs: 1000, leaseMs: 25_000 }
) {
  const controller = new AbortController()
  const signal = AbortSignal.any([request.signal, controller.signal])
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(output) {
      const deadline = Date.now() + options.leaseMs
      let cursor = after
      output.enqueue(encoder.encode(': ping\n\n'))
      const heartbeat = setInterval(() => {
        if (!signal.aborted) output.enqueue(encoder.encode(': ping\n\n'))
      }, 10_000)
      try {
        while (!signal.aborted && Date.now() < deadline) {
          const batch = await read(cursor)
          if (signal.aborted) break
          for (const event of batch.events) {
            output.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
            cursor = event.id
          }
          if (!batch.active && batch.events.length < 100) break
          if (batch.events.length < 100) await setTimeout(options.pollMs, undefined, { signal })
        }
      } catch {
        // Closing early makes Raycast consult the persisted turn and reconnect.
      } finally {
        clearInterval(heartbeat)
        if (!controller.signal.aborted) output.close()
      }
    },
    cancel() { controller.abort() }
  })
  return new Response(stream, { headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-store', 'x-accel-buffering': 'no' } })
}

export interface RaycastEvent {
  id: number
  turnId: string
  type: 'turn.started' | 'tool.started' | 'tool.finished' | 'message.completed' | 'turn.failed' | 'turn.cancelled'
  data: Record<string, unknown>
}

export interface RaycastTurn {
  state: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  text?: string
  error?: string
}

/** Derive stable replay cursors and turn records from Eve's existing durable history. */
export async function readRaycastHistory(session: SessionReader, signal?: AbortSignal) {
  let view = emptySessionView()
  const events: RaycastEvent[] = []
  const turns = new Map<string, RaycastTurn>()
  const deliveries = new Map<string, string>()
  const active = (turn: RaycastTurn) => turn.state === 'queued' || turn.state === 'running'
  function emit(turnId: string, type: RaycastEvent['type'], data: Record<string, unknown>) {
    events.push({ id: events.length + 1, turnId, type, data })
  }
  function finish(turnId: string, type: RaycastEvent['type'], data: Record<string, unknown>) {
    const turn = turns.get(turnId)
    if (!turn || !active(turn)) return
    Object.assign(turn, { state: type === 'message.completed' ? 'completed' : type === 'turn.cancelled' ? 'cancelled' : 'failed', ...data })
    emit(turnId, type, data)
  }
  for await (const event of session.stream({ follow: false, signal })) {
    view = foldEvents(view, [event])
    if (event.type === 'delivery.admitted' && event.data.source && 'channel' in event.data.source && event.data.source.channel === 'channel:raycast' && !event.data.source.hook) {
      turns.set(event.data.deliveryId, { state: 'queued' })
      emit(event.data.deliveryId, 'turn.started', { queued: true })
    } else if (event.type === 'delivery.consumed' && turns.has(event.data.deliveryId)) {
      deliveries.set(event.data.turnId, event.data.deliveryId)
      turns.get(event.data.deliveryId)!.state = 'running'
    } else if (event.type === 'delivery.settled' && event.data.outcome !== 'handled' && event.data.outcome !== 'awaiting-input') {
      finish(event.data.deliveryId, event.data.outcome === 'ignored' ? 'turn.cancelled' : 'turn.failed', { error: 'Nuxi could not start this turn. Please try again.' })
    } else if (event.type === 'session.ended') {
      for (const turnId of turns.keys()) finish(turnId, 'turn.failed', { error: 'This conversation ended. Start a new chat in Raycast.' })
    } else {
      const turnId = event.scope?.turnId && deliveries.get(event.scope.turnId)
      if (!turnId || !active(turns.get(turnId)!)) continue
      if (event.type === 'call.started' || event.type === 'call.settled') {
        const tool = call(view, event.data.callId)
        if (!tool || tool.kind === 'control') continue
        emit(turnId, event.type === 'call.started' ? 'tool.started' : 'tool.finished', {
          tool: tool.name, toolUseId: tool.callId,
          ...(event.type === 'call.started' ? { title: `Running ${tool.name.replace(/[_-]+/g, ' ')}` } : { ok: event.data.outcome === 'completed' })
        })
      } else if (event.type === 'turn.paused') {
        finish(turnId, 'turn.failed', { error: 'Continue on nuxt.com for actions requiring approval or sign-in.' })
      } else if (event.type === 'turn.settled') {
        if (event.data.outcome === 'completed') {
          const text = reply(view, event.data.turnId).flatMap(part => part.kind === 'text' && typeof part.value === 'string' ? [part.value] : []).join('\n\n')
          finish(turnId, 'message.completed', { text: text || 'Nuxi finished without a text reply.' })
        } else finish(turnId, event.data.outcome === 'cancelled' ? 'turn.cancelled' : 'turn.failed', event.data.outcome === 'cancelled' ? {} : { error: 'Nuxi could not complete this turn. Please try again.' })
      }
    }
  }
  return { events, turns, active: [...turns.values()].some(active) }
}
