import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { basename, dirname } from 'node:path/posix'
import { createClient } from 'redis'

/**
 * Passes files from a conversation to its coder. eve saves an attachment in the sandbox of the
 * session that received it. A subagent has its own sandbox and receives only the text of its task,
 * so a file waits in a store both sides reach from the app runtime:
 *
 *   /workspace/.eve/attachments/3f2a9c1e/cover.png   in the conversation's sandbox
 *   -> shareAttachments   -> store, under the conversation's session id
 *   -> receiveAttachments -> /workspace/shared/3f2a9c1e/cover.png   in the coder's sandbox
 */

/** Where eve saves attachments, each in a directory of its own. */
export const ATTACHMENTS_DIR = '/workspace/.eve/attachments'
/** Where the coder finds them. */
export const SHARED_DIR = '/workspace/shared'
export const MAX_SHARED_FILES = 5
export const MAX_SHARED_BYTES = 10 * 1024 * 1024
/** A task starts minutes after the file is shared; an hour also covers a follow-up in the same thread. */
const TTL_SECONDS = 60 * 60

/** `name` is the file's path under `SHARED_DIR`, such as `3f2a9c1e/cover.png`. */
export interface SharedFile {
  readonly name: string
  readonly bytes: Uint8Array
}

export interface HandoffStore {
  /** Adds `files` to the ones the session already shared. */
  put(sessionId: string, files: readonly SharedFile[]): Promise<void>
  get(sessionId: string): Promise<SharedFile[]>
}

/**
 * Redis wherever `REDIS_URL` is set, the one the Discord channel keeps its state in. Without it, a
 * local directory, which only works when both tools run on one machine: on Vercel they can run in
 * different function instances, so there it is an error instead of a file that never arrives.
 */
export function handoffStore(env: NodeJS.ProcessEnv = process.env): HandoffStore {
  const url = env.REDIS_URL?.trim()
  if (url) return redisStore(url)
  if (env.VERCEL) throw new Error('`REDIS_URL` is not set on this deployment, and a file reaches the coder through Redis.')
  return localStore()
}

/** A hash per session, one field per file, as base64. The prefix keeps it apart from the Chat SDK state on the same Redis. */
export function redisStore(url: string): HandoffStore {
  const key = (sessionId: string) => `nuxi:handoff:${sessionId}`

  // A connection per call: a hand-off is a few calls per task, and there is no connection to keep
  // healthy between them. Without `reconnectStrategy: false`, node-redis retries forever, and a
  // Redis that is away would hold the tool call and its turn instead of failing it.
  async function withRedis<T>(run: (redis: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
    const redis = createClient({ url, socket: { connectTimeout: 5_000, reconnectStrategy: false } })
    // node-redis throws an error nobody listens to. The call that failed rejects with it anyway.
    redis.on('error', () => {})
    await redis.connect()
    try {
      return await run(redis)
    } finally {
      redis.destroy()
    }
  }

  return {
    put: (sessionId, files) => withRedis(async (redis) => {
      const fields = Object.fromEntries(files.map(({ name, bytes }) => [name, Buffer.from(bytes).toString('base64')]))
      await redis.multi().hSet(key(sessionId), fields).expire(key(sessionId), TTL_SECONDS).exec()
    }),
    get: sessionId => withRedis(async (redis) => {
      const fields = await redis.hGetAll(key(sessionId))
      return Object.entries(fields).map(([name, data]) => ({ name, bytes: new Uint8Array(Buffer.from(data, 'base64')) }))
    })
  }
}

/** A directory per session on this machine, for `pnpm nuxi`. Nothing expires. */
export function localStore(root = join(tmpdir(), 'nuxi-handoff')): HandoffStore {
  const directory = (sessionId: string) => join(root, encodeURIComponent(sessionId))
  return {
    async put(sessionId, files) {
      await mkdir(directory(sessionId), { recursive: true })
      // `name` holds a slash: encoded, each file sits flat in the session's directory.
      await Promise.all(files.map(({ name, bytes }) => writeFile(join(directory(sessionId), encodeURIComponent(name)), bytes)))
    },
    async get(sessionId) {
      const entries = await readdir(directory(sessionId)).catch(() => [])
      return Promise.all(entries.map(async entry => ({
        name: decodeURIComponent(entry),
        bytes: new Uint8Array(await readFile(join(directory(sessionId), entry)))
      })))
    }
  }
}

/** A path segment an attachment gave, made safe to write and to type in a shell. */
function safe(segment: string) {
  return segment.replace(/[^\w.-]+/g, '-').replace(/^[.-]+/, '') || 'file'
}

/** What both tools return: where the coder finds each file. */
function shared(files: readonly SharedFile[]) {
  return files.map(({ name, bytes }) => ({ path: `${SHARED_DIR}/${name}`, bytes: bytes.byteLength }))
}

/**
 * Copy attachments of a conversation out of its sandbox, for its coder. A file keeps its own
 * directory and its name, so two attachments called `image.png` stay two files.
 */
export async function shareAttachments({ sandbox, store, sessionId, paths }: {
  sandbox: { readBinaryFile(options: { path: string }): PromiseLike<Uint8Array | null> }
  store: HandoffStore
  sessionId: string
  paths: readonly string[]
}) {
  const files = await Promise.all(paths.map(async (path) => {
    if (!path.startsWith(`${ATTACHMENTS_DIR}/`) || path.includes('..')) throw new Error(`Only files under ${ATTACHMENTS_DIR} are shared, not "${path}".`)
    const bytes = await sandbox.readBinaryFile({ path })
    if (!bytes) throw new Error(`No file at "${path}".`)
    if (bytes.byteLength > MAX_SHARED_BYTES) throw new Error(`"${basename(path)}" is ${bytes.byteLength} bytes; the limit is ${MAX_SHARED_BYTES}.`)
    return { name: `${safe(basename(dirname(path)))}/${safe(basename(path))}`, bytes }
  }))
  await store.put(sessionId, files)
  return shared(files)
}

/** Copy what the parent conversation shared into the coder's sandbox, under `SHARED_DIR`. */
export async function receiveAttachments({ sandbox, store, sessionId }: {
  sandbox: { writeBinaryFile(options: { path: string, content: Uint8Array }): PromiseLike<void> }
  store: HandoffStore
  sessionId: string
}) {
  const files = await store.get(sessionId)
  await Promise.all(files.map(({ name, bytes }) => sandbox.writeBinaryFile({ path: `${SHARED_DIR}/${name}`, content: bytes })))
  return shared(files)
}
