import { defineMemoryProvider } from 'eve/memory'
import { fileMemory, inMemory, MemoryDocumentConflictError, type MemoryDocument, type MemoryDocumentBackend } from 'eve/memory/file'
import { resolveContext, type AuthContext } from './identity/context.js'
import { appFetch, internalHeaders } from './internal-api.js'

/**
 * The nuxt.com account whose notes this session may read and write, from trusted auth, never
 * from the model. Only signed-in web users have one: anonymous visitors, Slack, Discord and
 * schedules get no memory, so nothing one person says ends up in a conversation others read.
 */
export function memoryOwner(auth: AuthContext | null | undefined): string | null {
  if (resolveContext(auth).surface !== 'web') return null
  return auth?.principalType === 'user' && auth.principalId ? auth.principalId : null
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

/** The scope is the owner's account id, stored with the document so deleting the account deletes it. */
function backendFor(value: string | readonly string[]): MemoryDocumentBackend {
  if (!process.env.INTERNAL_API_SECRET?.trim()) return localBackend
  return nuxtBackend(typeof value === 'string' ? value : null)
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
