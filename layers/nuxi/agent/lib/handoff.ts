import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { basename, dirname } from 'node:path/posix'
import { createClient } from 'redis'

/** Where eve saves the files a message carries, in the sandbox of the session that received it. */
export const ATTACHMENTS_DIR = '/workspace/.eve/attachments'
/** Where the coder finds the files its conversation shared, in its own sandbox. */
export const SHARED_DIR = '/workspace/shared'
export const MAX_SHARED_FILES = 5
export const MAX_SHARED_BYTES = 10 * 1024 * 1024
/** A task starts minutes after the file is shared; an hour also covers a follow-up in the same thread. */
const TTL_SECONDS = 60 * 60
/** What a shared file may be called: it becomes a path in the coder's sandbox. */
const NAME = /^\w[\w.-]*$/

export interface SharedFile {
  readonly name: string
  readonly bytes: Uint8Array
}

/**
 * Holds the files of one session until its coder reads them. A subagent has its own sandbox and
 * receives only the text of its task, so a file needs a place both sides reach from the app runtime.
 */
export interface HandoffStore {
  /** Adds `files` to the ones `sessionId` already shared; a file of the same name is replaced. */
  put(sessionId: string, files: readonly SharedFile[]): Promise<void>
  get(sessionId: string): Promise<SharedFile[]>
}

type Redis = ReturnType<typeof createClient>
let connection: Promise<Redis> | undefined

/**
 * One connection per function instance. node-redis retries a lost connection forever by default,
 * which would hold a tool call, and the turn with it, for as long as Redis is away. Here it gives
 * up after three tries and closes, and a closed connection is replaced on the next call.
 */
function connect(url: string): Promise<Redis> {
  // Each call waits for the one before it, so calls made together share the connection the first opens.
  const previous = connection
  connection = (async () => {
    const current = await previous?.catch(() => undefined)
    if (current?.isOpen) return current

    return createClient({
      url,
      socket: { connectTimeout: 5_000, reconnectStrategy: retries => retries < 2 ? 200 : new Error('Redis is unreachable.') }
    })
      // node-redis throws an error nobody listens to. The command that failed rejects with it anyway.
      .on('error', () => {})
      .connect()
  })()
  return connection
}

/** A hash per session, one field per file, as base64. The prefix keeps it apart from the Chat SDK state on the same Redis. */
export function redisStore(url: string): HandoffStore {
  const key = (sessionId: string) => `nuxi:handoff:${sessionId}`
  return {
    async put(sessionId, files) {
      const redis = await connect(url)
      await redis.multi()
        .hSet(key(sessionId), Object.fromEntries(files.map(({ name, bytes }) => [name, Buffer.from(bytes).toString('base64')])))
        .expire(key(sessionId), TTL_SECONDS)
        .exec()
    },
    async get(sessionId) {
      const stored = await (await connect(url)).hGetAll(key(sessionId))
      return Object.entries(stored).map(([name, data]) => ({ name, bytes: new Uint8Array(Buffer.from(data, 'base64')) }))
    }
  }
}

/** A directory per session on this machine, for `pnpm nuxi`. Nothing expires. */
export function localStore(root = join(tmpdir(), 'nuxi-handoff')): HandoffStore {
  const directory = (sessionId: string) => join(root, encodeURIComponent(sessionId))
  return {
    async put(sessionId, files) {
      await mkdir(directory(sessionId), { recursive: true })
      await Promise.all(files.map(({ name, bytes }) => writeFile(join(directory(sessionId), name), bytes)))
    },
    async get(sessionId) {
      const names = await readdir(directory(sessionId)).catch(() => [])
      return Promise.all(names.map(async name => ({ name, bytes: new Uint8Array(await readFile(join(directory(sessionId), name))) })))
    }
  }
}

/**
 * Redis wherever `REDIS_URL` is set, the one the Discord channel keeps its state in. Without it, a
 * local directory, which only works when both tools run on one machine: on Vercel they can run in
 * different function instances, so there it is an error instead of a file that silently never arrives.
 */
export function handoffStore(env: NodeJS.ProcessEnv = process.env): HandoffStore {
  const url = env.REDIS_URL?.trim()
  if (url) return redisStore(url)
  if (env.VERCEL) throw new Error('`REDIS_URL` is not set on this deployment, and a file reaches the coder through Redis.')
  return localStore()
}

/** The part of a sandbox each side needs. */
interface Reader {
  readBinaryFile(options: { path: string }): PromiseLike<Uint8Array | null>
}
interface Writer {
  writeBinaryFile(options: { path: string, content: Uint8Array }): PromiseLike<void>
}

function sharedName(path: string) {
  return basename(path).replace(/[^\w.-]+/g, '-').replace(/^[.-]+/, '') || 'file'
}

/**
 * Copy attachments of a conversation out of its sandbox, for its coder. Each keeps its file name,
 * made safe for a path. Two attachments of the same name also get the start of the directory eve
 * gave each one, which is a hash of its content.
 */
export async function shareAttachments({ sandbox, store, sessionId, paths }: {
  sandbox: Reader
  store: HandoffStore
  sessionId: string
  paths: readonly string[]
}) {
  const unique = [...new Set(paths)]
  if (!unique.length) throw new Error('No file to share.')
  if (unique.length > MAX_SHARED_FILES) throw new Error(`${unique.length} files; the limit is ${MAX_SHARED_FILES} per call.`)

  const read = await Promise.all(unique.map(async (path) => {
    if (!path.startsWith(`${ATTACHMENTS_DIR}/`) || path.includes('..')) throw new Error(`Only files under ${ATTACHMENTS_DIR} are shared, not "${path}".`)
    const bytes = await sandbox.readBinaryFile({ path })
    if (!bytes) throw new Error(`No file at "${path}".`)
    if (bytes.byteLength > MAX_SHARED_BYTES) throw new Error(`"${basename(path)}" is ${bytes.byteLength} bytes; the limit is ${MAX_SHARED_BYTES}.`)
    return { path, bytes, name: sharedName(path) }
  }))

  const files = read.map(({ path, bytes, name }) => ({
    name: read.filter(other => other.name === name).length > 1 ? `${sharedName(dirname(path)).slice(0, 8)}-${name}` : name,
    bytes
  }))
  await store.put(sessionId, files)
  return files.map(({ name, bytes }) => ({ name, bytes: bytes.byteLength }))
}

/** Copy what the parent conversation shared into the coder's sandbox, under `SHARED_DIR`. */
export async function receiveAttachments({ sandbox, store, sessionId }: {
  sandbox: Writer
  store: HandoffStore
  sessionId: string
}) {
  // The store is shared with other code: a name is checked again before it becomes a path.
  const files = (await store.get(sessionId)).filter(({ name, bytes }) => NAME.test(name) && bytes.byteLength <= MAX_SHARED_BYTES)
  await Promise.all(files.map(({ name, bytes }) => sandbox.writeBinaryFile({ path: `${SHARED_DIR}/${name}`, content: bytes })))
  return files.map(({ name, bytes }) => ({ path: `${SHARED_DIR}/${name}`, bytes: bytes.byteLength }))
}
