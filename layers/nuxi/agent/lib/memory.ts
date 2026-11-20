import { defineMemoryProvider, type MemoryScopeContext } from 'eve/memory'
import { fileMemory, inMemory, MemoryDocumentConflictError, type MemoryDocument, type MemoryDocumentBackend } from 'eve/memory/file'
import { resolveContext, type AuthContext } from './identity/context.js'
import { appFetch, internalHeaders } from './internal-api.js'

/**
 * Where the current session runs, from trusted channel and auth data, never from the model.
 * Slack DMs and signed-in nuxt.com users are private. A Slack channel, group DM or private
 * channel is shared by everyone in it. Anything else (anonymous web visitors, Discord,
 * schedules) gets no memory.
 */
export type Conversation
  = | { readonly kind: 'private', readonly owner: readonly [surface: string, id: string] }
    | { readonly kind: 'slack-channel', readonly teamId: string, readonly channelId: string }

export function currentConversation(auth: AuthContext | null | undefined): Conversation | null {
  const context = resolveContext(auth)
  if (context.surface === 'web') {
    return auth?.principalType === 'user' && auth.principalId
      ? { kind: 'private', owner: ['web', auth.principalId] }
      : null
  }
  if (context.surface !== 'slack' || !context.person || context.person.isBot || !context.channel) return null

  const teamId = auth?.issuer?.startsWith('slack:') ? auth.issuer.slice('slack:'.length) : undefined
  if (!teamId) return null
  // Slack DM conversation ids start with "D".
  if (context.channel.id.startsWith('D')) return { kind: 'private', owner: ['slack', `${teamId}:${context.person.id}`] }
  return { kind: 'slack-channel', teamId, channelId: context.channel.id }
}

export function scopeAuth(ctx: MemoryScopeContext): AuthContext | null | undefined {
  return ctx.session.auth.current
}

/** Memory lives in the nuxt.com database, through `server/api/internal/agent/memory/*`. */
function nuxtBackend(userId: string | null): MemoryDocumentBackend {
  async function call(action: 'read' | 'write', body: Record<string, unknown>, signal: AbortSignal) {
    return await appFetch(`/api/internal/agent/memory/${action}`, {
      method: 'POST',
      headers: await internalHeaders(),
      body: JSON.stringify(body),
      signal
    })
  }

  return {
    async read({ key, signal }) {
      const response = await call('read', { key }, signal)
      if (!response.ok) throw new Error(`Memory read failed (${response.status})`)
      return (await response.json() as { document: MemoryDocument | null }).document
    },
    async write({ key, content, expectedVersion, signal }) {
      const response = await call('write', { key, content, expectedVersion, userId }, signal)
      if (response.status === 409) throw new MemoryDocumentConflictError(key)
      if (!response.ok) throw new Error(`Memory write failed (${response.status})`)
      return (await response.json() as { document: MemoryDocument }).document
    }
  }
}

// `eve dev` without the Nuxt app (evals, `pnpm nuxi` alone) keeps memory in the process.
const localBackend = inMemory()

/** The nuxt.com account that owns a document, so deleting the account deletes its memory. */
function ownerUserId(value: string | readonly string[]): string | null {
  return Array.isArray(value) && value[0] === 'web' && typeof value[1] === 'string' ? value[1] : null
}

function backendFor(value: string | readonly string[]): MemoryDocumentBackend {
  return process.env.INTERNAL_API_SECRET?.trim() ? nuxtBackend(ownerUserId(value)) : localBackend
}

/**
 * eve's `fileMemory()`, one small document per scope edited with save and remove tools, stored
 * in the nuxt.com database instead of a Blob store. Recall failures are logged and skipped, so a
 * database hiccup costs the turn its notes, not its answer.
 */
export function nuxiMemory() {
  return defineMemoryProvider({
    recall: {
      async 'turn.started'(ctx) {
        try {
          return await fileMemory({ backend: backendFor(ctx.memory.scope.value) }).recall['turn.started'](ctx)
        } catch (error) {
          console.warn('[nuxi:memory] recall failed', { slot: ctx.memory.slot, error })
          return null
        }
      }
    },
    async tools(ctx) {
      return await fileMemory({ backend: backendFor(ctx.memory.scope.value) }).tools!(ctx)
    }
  })
}
